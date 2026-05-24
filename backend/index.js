// Entry point — starts the Express server
require('dotenv').config()  // MUST be line 1

const app = require('./app')
const tempManager = require('./utils/tempManager')

const PORT = 3001

const server = app.listen(PORT, () => {
  console.log('[Server] Repository Architecture Navigator backend running')
  console.log(`[Server] http://localhost:${PORT}`)
  console.log(`[Server] Health check: http://localhost:${PORT}/health`)
  console.log(`[Server] Analyze endpoint: POST http://localhost:${PORT}/analyze`)
  
  tempManager.ensureTempBase()
})

process.on('SIGINT', () => {
  console.log('[Server] Shutting down, cleaning temp directories...')
  tempManager.cleanOldRepoDirs()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('[Server] Shutting down, cleaning temp directories...')
  tempManager.cleanOldRepoDirs()
  process.exit(0)
})
