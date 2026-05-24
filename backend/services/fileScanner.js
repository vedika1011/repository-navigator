// fileScanner.js — Recursively walks a cloned repository directory and returns a structured list of source files.

const fs = require('fs');
const path = require('path');
const fileUtils = require('../utils/fileUtils');

/**
 * Internal recursive function to walk directory tree.
 */
function walkDirectory(rootPath, currentDir, results) {
  let entries;
  try {
    entries = fs.readdirSync(currentDir, { withFileTypes: true });
  } catch (error) {
    console.log(`[FileScanner] Could not read directory: ${currentDir} — ${error.message}`);
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (fileUtils.isIgnoredDirectory(entry.name)) {
        continue;
      }
      walkDirectory(rootPath, path.join(currentDir, entry.name), results);
    } else if (entry.isFile()) {
      if (!fileUtils.isAllowedExtension(entry.name)) {
        continue;
      }

      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = fileUtils.getRelativePath(rootPath, absolutePath);
      const directory = fileUtils.getRelativePath(rootPath, currentDir);
      
      results.push({
        id: relativePath,
        label: entry.name,
        absolutePath: absolutePath,
        relativePath: relativePath,
        extension: fileUtils.getFileExtension(entry.name),
        linesOfCode: fileUtils.estimateLinesOfCode(absolutePath),
        sizeBytes: fileUtils.getFileStats(absolutePath).sizeBytes,
        directory: directory === '' ? '.' : directory,
        depth: relativePath.split('/').length - 1
      });
    }
  }
}

/**
 * Scans a cloned repository and returns an array of ScannedFile objects.
 */
async function scanRepository(clonedPath) {
  if (!fs.existsSync(clonedPath)) {
    throw new Error("Cloned repository path does not exist: " + clonedPath);
  }

  console.log(`[FileScanner] Starting scan: ${clonedPath}`);
  
  const results = [];
  walkDirectory(clonedPath, clonedPath, results);
  
  console.log(`[FileScanner] Scan complete: ${results.length} files found`);
  
  return results;
}

module.exports = { scanRepository };
