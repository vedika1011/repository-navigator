// Route for retrying AI summary generation for a single file
const express = require('express')
const router = express.Router()
const fs = require('fs')
const aiService = require('../services/aiService')

router.post('/', async (req, res) => {
  const { nodeId, absolutePath, label, relativePath, extension, linesOfCode } = req.body
  
  if (!absolutePath || !label) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'absolutePath and label are required' }
    })
  }

  // Check if the file still exists on disk
  if (!fs.existsSync(absolutePath)) {
    return res.status(200).json({
      success: false,
      error: {
        code: 'FILE_NOT_FOUND',
        message: `The file "${label}" is no longer on disk. Re-analyze the repository to regenerate summaries.`
      }
    })
  }

  console.log(`[Summarize] Retry request for: ${label}`)

  if (!aiService.isAIEnabled()) {
    return res.status(200).json({
      success: false,
      error: {
        code: 'AI_DISABLED',
        message: 'AI summarization is disabled. Set OLLAMA_ENABLED=true in backend/.env and ensure Ollama is running.'
      }
    })
  }

  // Quick ping to see if Ollama is up
  try {
    const ping = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(2000)
    })
    if (!ping.ok) throw new Error('Ollama not responding')
  } catch {
    return res.status(200).json({
      success: false,
      error: {
        code: 'OLLAMA_OFFLINE',
        message: 'Ollama is not running. Start it with: ollama serve'
      }
    })
  }

  try {
    const summary = await aiService.summarizeFile({
      absolutePath, label, relativePath, extension, linesOfCode
    })

    if (!summary) {
      return res.status(200).json({
        success: false,
        error: { code: 'SUMMARY_FAILED', message: 'AI could not generate a summary. Try again in a few seconds.' }
      })
    }

    res.json({ success: true, summary, summaryType: 'ai' })
  } catch (err) {
    console.error(`[Summarize] Error: ${err.message}`)
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    })
  }
})

module.exports = router
