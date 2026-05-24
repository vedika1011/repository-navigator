// analyzeController.js — Business logic for the POST /analyze endpoint.

const { runAnalysis, PipelineError } = require("../services/analysisPipeline");
const { buildResponse } = require("../utils/responseBuilder");

/**
 * Handles the analyze request:
 * 1. Orchestrates the full analysis pipeline (clone, scan, build graph).
 * 2. Formats and limits the final response size.
 * 3. Handles pipeline-specific errors gracefully (422) and defers unknown errors (500).
 */
async function handleAnalyze(req, res, next) {
  try {
    const { repoUrl } = req.body;
    
    // 1. Run the complete pipeline
    const { rawGraph, meta } = await runAnalysis(repoUrl);
    
    // 2. Build, sanitize, and limit the final response payload
    const response = buildResponse(rawGraph, meta);
    
    // 3. Send successful 200 response
    res.json(response);
  } catch (err) {
    // If it's a known pipeline issue (e.g., clone failed, no JS files), return 422
    if (err instanceof PipelineError) {
      console.log(`[Controller] Pipeline error: ${err.message}`);
      return res.status(422).json({
        success: false,
        error: {
          code: err.code,
          message: err.message
        }
      });
    }
    
    // For unknown errors (e.g., graph builder crashes, out of memory), pass to global handler
    console.error("[Controller] Unexpected Error in handleAnalyze:", err.message);
    next(err);
  }
}

module.exports = { handleAnalyze };
