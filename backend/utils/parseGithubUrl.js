// parseGithubUrl.js — Extracts owner and repo name from a GitHub repository URL.

/**
 * Parses a GitHub URL and returns the owner and repo name.
 * Example: "https://github.com/facebook/react" → { owner: "facebook", repo: "react" }
 *
 * @param {string} url - A GitHub repository URL
 * @returns {{ owner: string, repo: string }}
 * @throws {Error} If the URL cannot be parsed into owner/repo
 */
function parseGithubUrl(url) {
  // Remove trailing slash if present
  const cleaned = url.replace(/\/$/, "");

  // Split on "/" to extract segments
  // https://github.com/owner/repo → ["https:", "", "github.com", "owner", "repo"]
  const parts = cleaned.split("/");

  const owner = parts[3];
  let repo = parts[4];

  if (!owner || !repo) {
    throw new Error("Could not parse GitHub URL: missing owner or repository name");
  }

  repo = repo.replace(/\.git$/, '');

  return { owner, repo };
}

module.exports = parseGithubUrl;
