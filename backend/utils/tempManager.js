// tempManager.js — Manages a single temp directory for cloned repositories with cleanup on request and shutdown.

const fs = require("fs");
const path = require("path");
const os = require("os");

/**
 * Returns the root temp working directory path.
 * Individual repo clones go inside this folder.
 */
function getTempBase() {
  return path.join(os.tmpdir(), "repo-navigator");
}

/**
 * Returns a unique directory path for cloning a specific repo.
 * Does NOT create the directory — simple-git will create it during clone.
 * Appending Date.now() ensures uniqueness if the same repo is analyzed twice quickly.
 */
function createRepoDir(owner, repo) {
  return path.join(getTempBase(), `${owner}_${repo}_${Date.now()}`);
}

/**
 * Deletes all subdirectories inside the temp base directory.
 * Runs BEFORE each new clone to ensure disk does not fill up.
 */
function cleanOldRepoDirs() {
  const base = getTempBase();

  // If the temp base does not exist, create it and return
  if (!fs.existsSync(base)) {
    fs.mkdirSync(base, { recursive: true });
    return;
  }

  const entries = fs.readdirSync(base, { withFileTypes: true });
  let cleaned = 0;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const dirPath = path.join(base, entry.name);
      fs.rmSync(dirPath, { recursive: true, force: true });
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[TempManager] Cleaned ${cleaned} old repo directories`);
  }
}

/**
 * Deletes one specific directory. Used for cleanup after a failed clone.
 * If the directory does not exist, does nothing.
 */
function cleanSingleDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`[TempManager] Deleted temp dir: ${dirPath}`);
  }
}

/**
 * Creates the temp base directory if it does not exist.
 * Call this once on server startup.
 */
function ensureTempBase() {
  const base = getTempBase();
  if (!fs.existsSync(base)) {
    fs.mkdirSync(base, { recursive: true });
  }
  console.log(`[TempManager] Temp base directory ready: ${base}`);
}

module.exports = {
  getTempBase,
  createRepoDir,
  cleanOldRepoDirs,
  cleanSingleDir,
  ensureTempBase,
};
