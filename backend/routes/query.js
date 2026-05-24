// query.js — Route handler for natural language repository queries
const express = require('express')
const router = express.Router()
const { queryGraph } = require('../services/queryService')

router.post('/', async (req, res) => {
  const { query, nodes } = req.body

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_QUERY', message: 'Query string is required.' }
    })
  }

  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_NODES', message: 'Node list is required.' }
    })
  }

  console.log(`[Query] Received: "${query}" against ${nodes.length} nodes`)

  try {
    const result = await queryGraph(query.trim(), nodes)

    console.log(`[Query] Found ${result.matches.length} matches`)

    res.json({
      success: true,
      query: result.queryUsed,
      matches: result.matches,
      totalCandidates: nodes.length,
    })
  } catch (err) {
    console.error(`[Query] Error: ${err.message}`)
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_ERROR', message: err.message }
    })
  }
})

module.exports = router
