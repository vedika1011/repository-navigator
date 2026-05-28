// overview.js — Generates a whole-repository AI overview on demand

const express = require('express')
const router = express.Router()
const { summarizeRepository, isAIEnabled } =
  require('../services/aiService')

router.post('/', async (req, res) => {
  const { owner, repo, nodes, edgeCount } = req.body

  if (!owner || !repo || !nodes) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELDS',
        message: 'owner, repo, and nodes are required'
      }
    })
  }

  if (!isAIEnabled()) {
    return res.status(200).json({
      success: false,
      error: {
        code: 'AI_DISABLED',
        message: 'AI is not enabled. Set AI_ENABLED=true and GROQ_API_KEY in backend/.env'
      }
    })
  }

  console.log(`[Overview] Generating for: ${owner}/${repo}`)

  // Reconstruct minimal edge array for context
  const fakeEdges = Array(edgeCount || 0).fill(null)

  try {
    const overview = await summarizeRepository(
      owner, repo, nodes, fakeEdges
    )

    if (!overview) {
      return res.status(200).json({
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: 'Could not generate overview. Try again in a moment.'
        }
      })
    }

    res.json({ success: true, overview })

  } catch (err) {
    console.error(`[Overview] Error: ${err.message}`)
    res.status(200).json({
      success: false,
      error: {
        code: err.code || 'ERROR',
        message: err.message
      }
    })
  }
})

module.exports = router
