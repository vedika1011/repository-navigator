// analyze.js — Route definition for POST /analyze. Applies validation middleware, then delegates to the controller.

const express = require("express");
const router = express.Router();
const validateRepo = require("../middleware/validateRepo");
const { handleAnalyze } = require("../controllers/analyzeController");

// POST / (mounted at /analyze in app.js, so full path is POST /analyze)
// 1. validateRepo checks that repoUrl is present and valid
// 2. handleAnalyze parses the URL and returns mock graph data
router.post("/", validateRepo, handleAnalyze);

module.exports = router;
