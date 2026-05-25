// aiService.js — Calls local Ollama API for AI-generated file summaries (no rate limits, no API key)
const fs = require('fs')
const summaryCache = require('../utils/summaryCache')

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'
const OLLAMA_ENABLED = process.env.OLLAMA_ENABLED === 'true'
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '60000')
const MAX_CHARS = 4000  // More chars since we have no token cost concern

// Check if Ollama is running at startup
async function checkOllamaAvailable() {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000)
    })
    if (res.ok) {
      const data = await res.json()
      const models = data.models?.map(m => m.name) || []
      const hasModel = models.some(m => m.includes(OLLAMA_MODEL.replace(':latest', '')))
      if (hasModel) {
        console.log(`[AIService] ✓ Ollama running — model "${OLLAMA_MODEL}" ready`)
      } else {
        console.warn(`[AIService] ⚠ Ollama running but model "${OLLAMA_MODEL}" not found`)
        console.warn(`[AIService] Run: ollama pull ${OLLAMA_MODEL}`)
      }
      return true
    }
  } catch (err) {
    console.warn('[AIService] ⚠ Ollama not detected at', OLLAMA_BASE_URL)
    console.warn('[AIService] Install from https://ollama.com and run: ollama pull llama3.2')
    return false
  }
}

// Run availability check on module load
if (OLLAMA_ENABLED) {
  checkOllamaAvailable()
}

function isAIEnabled() {
  return OLLAMA_ENABLED === true || process.env.OLLAMA_ENABLED === 'true'
}

function buildPrompt(scannedFile, content) {
  return `You are a senior software engineer writing documentation for a new team member.

File: ${scannedFile.label}
Path: ${scannedFile.relativePath}
Language: ${scannedFile.extension.toUpperCase()}
Lines: ${scannedFile.linesOfCode}

Source code:
\`\`\`${scannedFile.extension}
${content}
\`\`\`

Write exactly 1-2 sentences explaining what this file does and
why it matters. Be specific to this actual code. Do not start
with 'This file'. Complete every sentence. No bullet points.
Respond with only the summary text, nothing else.`
}

async function callOllamaAPI(prompt) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 120,
          top_p: 0.9,
          repeat_penalty: 1.1,
        }
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Ollama API error ${response.status}: ${errText}`)
    }

    const data = await response.json()
    const summary = data.response?.trim()

    if (!summary || summary.length < 20) {
      throw new Error('Ollama returned empty or too-short response')
    }

    return summary

  } finally {
    clearTimeout(timeout)
  }
}

async function summarizeFile(scannedFile) {
  try {
    if (!scannedFile.absolutePath) {
      console.warn(`[AIService] No absolutePath for: ${scannedFile.label}`)
      return null
    }

    if (!fs.existsSync(scannedFile.absolutePath)) {
      console.warn(`[AIService] File no longer exists: ${scannedFile.absolutePath}`)
      return null
    }

    let content
    try {
      content = fs.readFileSync(scannedFile.absolutePath, 'utf8')
    } catch (readErr) {
      console.warn(`[AIService] Cannot read: ${scannedFile.label} — ${readErr.message}`)
      return null
    }

    if (!content || content.trim().length < 20) {
      console.warn(`[AIService] File too short: ${scannedFile.label}`)
      return null
    }

    // Truncate very large files
    const truncated = content.length > MAX_CHARS
      ? content.slice(0, MAX_CHARS) + '\n// ... (truncated for analysis)'
      : content

    // Check cache using content hash
    const hash = summaryCache.hashContent(content)
    const cached = summaryCache.get(hash)
    if (cached) {
      console.log(`[AIService] Cache hit: ${scannedFile.label}`)
      return cached
    }

    const prompt = buildPrompt(scannedFile, truncated)

    console.log(`[AIService] Summarizing: ${scannedFile.label}`)
    const summary = await callOllamaAPI(prompt)

    summaryCache.set(hash, summary)
    console.log(`[AIService] ✓ Done: ${scannedFile.label} (${summary.length} chars)`)
    return summary

  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`[AIService] Timeout: ${scannedFile.label} (>${AI_TIMEOUT_MS}ms)`)
    } else {
      console.warn(`[AIService] Failed: ${scannedFile.label} — ${err.message}`)
    }
    return null
  }
}

module.exports = { isAIEnabled, summarizeFile, checkOllamaAvailable }
