// aiService.js — AI summarization using Groq API (free: 30 RPM, 6K TPM, 14.4K RPD)

const fs = require('fs')
const summaryCache = require('../utils/summaryCache')

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
const AI_ENABLED = process.env.AI_ENABLED === 'true'
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '25000')
const MAX_CHARS = 3000

if (AI_ENABLED && !GROQ_API_KEY) {
  console.warn('[AIService] WARNING: AI_ENABLED=true but GROQ_API_KEY not set')
  console.warn('[AIService] Get a free key at: console.groq.com')
} else if (AI_ENABLED) {
  console.log(`[AIService] ✓ Groq ready — ${GROQ_MODEL}`)
  console.log('[AIService] Rate limits: 30 RPM, 6,000 TPM, 14,400 RPD')
}

function isAIEnabled() {
  return Boolean(AI_ENABLED && GROQ_API_KEY)
}

function parseGroqError(status, headers) {
  if (status === 429) {
    const resetTokens = headers?.get('x-ratelimit-reset-tokens')
    const retryAfter = headers?.get('retry-after')
    const resetIn = resetTokens || retryAfter || '60s'
    return {
      code: 'TOKEN_LIMIT_MINUTE',
      userMessage:
        `AI summaries paused — Groq's free tier limit of 6,000 tokens ` +
        `per minute was reached. Summaries will resume in ${resetIn}. ` +
        `You can still generate individual summaries from the sidebar.`,
      retryAfterMs: parseFloat(retryAfter || '60') * 1000,
    }
  }
  if (status === 401) {
    return {
      code: 'INVALID_KEY',
      userMessage: 'Invalid Groq API key. Check GROQ_API_KEY in backend/.env',
      retryAfterMs: null,
    }
  }
  if (status === 503 || status === 502) {
    return {
      code: 'SERVICE_DOWN',
      userMessage: 'Groq AI service temporarily unavailable. Try again in a few minutes.',
      retryAfterMs: 120000,
    }
  }
  return {
    code: 'API_ERROR',
    userMessage: `AI service error (${status}). Placeholder summaries shown instead.`,
    retryAfterMs: null,
  }
}

function buildSummaryPrompt(scannedFile, content) {
  return `You are documenting a codebase for a new developer.

File: ${scannedFile.label}
Path: ${scannedFile.relativePath}
Language: ${(scannedFile.extension || 'js').toUpperCase()}

\`\`\`${scannedFile.extension || 'js'}
${content}
\`\`\`

Write exactly 2 sentences:
1. What this file does
2. Why it matters in this codebase

Rules: Be specific. Do not start with "This file". Complete sentences only.
Respond with the 2 sentences only — no labels, no formatting.`
}

async function callGroqAPI(messages, maxTokens = 150) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

  let response
  try {
    response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const errorInfo = parseGroqError(response.status, response.headers)
    const err = new Error(errorInfo.userMessage)
    err.code = errorInfo.code
    err.retryAfterMs = errorInfo.retryAfterMs
    err.isGroqError = true
    throw err
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content?.trim()
  if (!content || content.length < 10) {
    throw new Error('Empty response from Groq API')
  }
  return content
}

async function summarizeFile(scannedFile) {
  try {
    if (!scannedFile?.absolutePath) return null
    if (!fs.existsSync(scannedFile.absolutePath)) return null

    let content
    try {
      content = fs.readFileSync(scannedFile.absolutePath, 'utf8')
    } catch { return null }

    if (!content || content.trim().length < 20) return null

    const truncated = content.length > MAX_CHARS
      ? content.slice(0, MAX_CHARS) + '\n// ...(truncated)'
      : content

    const hash = summaryCache.hashContent(content)
    const cached = summaryCache.get(hash)
    if (cached) {
      console.log(`[AIService] Cache hit: ${scannedFile.label}`)
      return cached
    }

    const prompt = buildSummaryPrompt(scannedFile, truncated)
    console.log(`[AIService] Summarizing: ${scannedFile.label}`)
    const summary = await callGroqAPI([{ role: 'user', content: prompt }], 150)

    summaryCache.set(hash, summary)
    console.log(`[AIService] ✓ ${scannedFile.label} (${summary.length} chars)`)
    return summary

  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`[AIService] Timeout: ${scannedFile.label}`)
    } else if (err.isGroqError) {
      console.warn(`[AIService] Groq [${err.code}]: ${err.message}`)
    } else {
      console.warn(`[AIService] Failed: ${scannedFile.label} — ${err.message}`)
    }
    return null
  }
}

async function summarizeRepository(owner, repo, clonedPath, nodes, edges) {
  try {
    const path = require('path')
    let readmeContent = null
    try {
      if (clonedPath && fs.existsSync(clonedPath)) {
        const files = fs.readdirSync(clonedPath)
        const readmeFile = files.find(f => f.toLowerCase() === 'readme.md')
        if (readmeFile) {
          const readmePath = path.join(clonedPath, readmeFile)
          const content = fs.readFileSync(readmePath, 'utf8')
          // Truncate to first 2500 characters to prevent token limits
          readmeContent = content.length > 2500 
            ? content.slice(0, 2500) + '\n// ...(truncated)' 
            : content
        }
      }
    } catch (err) {
      console.warn(`[AIService] Failed to read README.md: ${err.message}`)
    }

    const entryFiles = nodes
      .filter(n => n.type === 'entry')
      .map(n => n.label)
      .slice(0, 3)
      .join(', ')

    const topFiles = nodes
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 8)
      .map(n => `${n.label} (${n.type})`)
      .join(', ')

    const typeBreakdown = {}
    nodes.forEach(n => {
      typeBreakdown[n.type] = (typeBreakdown[n.type] || 0) + 1
    })
    const breakdown = Object.entries(typeBreakdown)
      .map(([t, c]) => `${c} ${t}`).join(', ')

    const prompt =
      `You are explaining a GitHub repository to a new developer.\n\n` +
      `Repository: ${owner}/${repo}\n` +
      (readmeContent ? `Project README.md excerpt:\n\"\"\"\n${readmeContent}\n\"\"\"\n\n` : '') +
      `Total files: ${nodes.length}\n` +
      `Dependencies: ${edges.length} connections\n` +
      `File breakdown: ${breakdown}\n` +
      `Entry points: ${entryFiles || 'none detected'}\n` +
      `Most important files: ${topFiles}\n\n` +
      `Write a 3-4 sentence overview:\n` +
      `1. What this project/library does (base this on the README content if available; otherwise infer from folder layout and file names)\n` +
      `2. How it is structured\n` +
      `3. What a new developer should know before exploring\n\n` +
      `Be specific to "${repo}". Complete sentences only.\n` +
      `Respond with the overview text only.`

    console.log(`[AIService] Generating repo overview: ${owner}/${repo}`)
    const overview = await callGroqAPI([{ role: 'user', content: prompt }], 250)
    console.log('[AIService] ✓ Repo overview generated')
    return overview
  } catch (err) {
    console.warn(`[AIService] Repo overview failed: ${err.message}`)
    return null
  }
}

module.exports = { isAIEnabled, summarizeFile, summarizeRepository, callGroqAPI }
