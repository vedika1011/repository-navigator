// validateRepo.js — Middleware that validates the repoUrl field in the request body before reaching the controller.

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;

function validateRepo(req, res, next) {
  // Check that request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_REPO_URL",
        message: "Request body is missing or not valid JSON. Send a JSON object with a 'repoUrl' field.",
      },
    });
  }

  const { repoUrl } = req.body;

  // Check that repoUrl is present
  if (!repoUrl) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_REPO_URL",
        message: "Missing required field 'repoUrl'. Example: { \"repoUrl\": \"https://github.com/owner/repo\" }",
      },
    });
  }

  // Check that repoUrl is a string
  if (typeof repoUrl !== "string") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_REPO_URL",
        message: "Field 'repoUrl' must be a string, received " + typeof repoUrl + ".",
      },
    });
  }

  // Check that repoUrl matches the expected GitHub URL pattern
  if (!GITHUB_URL_REGEX.test(repoUrl)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_REPO_URL",
        message: "Invalid GitHub URL format. Expected: https://github.com/owner/repository — received: " + repoUrl,
      },
    });
  }

  // All checks passed — continue to the controller
  next();
}

module.exports = validateRepo;
