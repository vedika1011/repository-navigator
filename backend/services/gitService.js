// gitService.js — Wraps simple-git to shallow-clone a GitHub repository into a temp directory with timeout and cleanup.

const simpleGit = require("simple-git");
const tempManager = require("../utils/tempManager");
const parseGithubUrl = require("../utils/parseGithubUrl");

/**
 * Clones a public GitHub repository to a local temp directory.
 * Uses shallow clone (--depth=1, --single-branch) for speed.
 * Cleans up old clones before starting a new one.
 *
 * @param {string} repoUrl - Full GitHub URL (e.g. "https://github.com/facebook/react")
 * @returns {Promise<{ owner: string, repo: string, clonedPath: string }>}
 * @throws {Error} Human-readable error message on failure
 */
async function cloneRepo(repoUrl) {
  // 1. Parse the URL to extract owner and repo
  const { owner, repo } = parseGithubUrl(repoUrl);

  // Block known-huge repositories that will timeout
  const BLOCKED_REPOS = [
    'facebook/react',
    'microsoft/TypeScript', 
    'torvalds/linux',
    'chromium/chromium'
  ];

  const repoKey = `${owner}/${repo}`.toLowerCase();
  const isBlocked = BLOCKED_REPOS.some(b => b.toLowerCase() === repoKey);
  if (isBlocked) {
    throw new Error(`The repository "${owner}/${repo}" is too large to analyze in real time. Please try a smaller repository (under ~500 files).`);
  }

  // 2. Clean up any previous clones to free disk space
  tempManager.cleanOldRepoDirs();

  // 3. Generate a unique target directory path
  const targetDir = tempManager.createRepoDir(owner, repo);

  console.log(`[GitService] Starting clone: ${repoUrl} → ${targetDir}`);

  // 4. Initialize simple-git
  const git = simpleGit({
    baseDir: process.cwd(),
    binary: "git",
    maxConcurrentProcesses: 1,
    trimmed: false,
  });

  // 5. Clone with a 30-second timeout
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            "Clone timed out after 30 seconds. The repository may be too large."
          )
        ),
      30000
    )
  );

  try {
    await Promise.race([
      git.clone(repoUrl, targetDir, ["--depth=1", "--single-branch"]),
      timeoutPromise,
    ]);

    console.log(`[GitService] Clone complete: ${targetDir}`);

    return { owner, repo, clonedPath: targetDir };
  } catch (error) {
    // Clean up the partial clone directory
    tempManager.cleanSingleDir(targetDir);

    console.log(`[GitService] Clone failed: ${error.message}`);

    // Throw human-readable errors
    if (error.message.includes("Repository not found")) {
      throw new Error(
        "Repository not found or is private. Only public repositories are supported."
      );
    }
    if (error.message.includes("already exists")) {
      throw new Error(
        "Clone target directory already exists. This is a bug — please restart the server."
      );
    }
    if (error.message.includes("not a git repository")) {
      throw new Error(
        "The URL does not point to a valid git repository."
      );
    }

    throw new Error("Failed to clone repository: " + error.message);
  }
}

module.exports = { cloneRepo };
