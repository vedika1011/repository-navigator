// fileUtils.js — Pure utility functions for file path operations used by the scanner.

const fs = require('fs');
const path = require('path');

const EXTENSION_MAP = {
  // JavaScript / TypeScript
  '.js': 'javascript', '.jsx': 'javascript',
  '.mjs': 'javascript', '.cjs': 'javascript',
  '.ts': 'typescript', '.tsx': 'typescript',
  // Python
  '.py': 'python', '.pyw': 'python',
  // Java
  '.java': 'java',
  // C / C++
  '.c': 'c', '.cpp': 'cpp', '.cc': 'cpp',
  '.cxx': 'cpp', '.h': 'c', '.hpp': 'cpp',
  // C#
  '.cs': 'csharp',
  // Go
  '.go': 'go',
  // Rust
  '.rs': 'rust',
  // Ruby
  '.rb': 'ruby',
  // PHP
  '.php': 'php',
  // Swift
  '.swift': 'swift',
  // Kotlin
  '.kt': 'kotlin', '.kts': 'kotlin',
  // Scala
  '.scala': 'scala',
  // Shell
  '.sh': 'bash', '.bash': 'bash', '.zsh': 'bash',
  // Web frameworks
  '.vue': 'vue', '.svelte': 'svelte',
}

function isAllowedExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return ext in EXTENSION_MAP
}

function getLanguageFromExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return EXTENSION_MAP[ext] || 'unknown'
}

function getFileExtension(filePath) {
  return path.extname(filePath).replace('.', '').toLowerCase()
}

const IGNORED_DIRECTORIES = new Set([
  // JS/TS
  'node_modules', 'dist', 'build', '.next', 'out',
  'coverage', '.nyc_output', '.parcel-cache',
  // Python
  '__pycache__', '.venv', 'venv', 'env', '.env',
  'site-packages', 'dist-packages', '.pytest_cache',
  'htmlcov', '.mypy_cache', '.ruff_cache',
  // Java
  'target', '.gradle', '.mvn', 'bin', 'obj',
  // Ruby
  '.bundle', 'vendor',
  // Go
  'vendor',
  // Rust
  'target',
  // General
  '.git', 'tmp', 'temp', 'cache', '.cache',
  'logs', '.idea', '.vscode', '__MACOSX',
])

function isIgnoredDirectory(dirName) {
  return IGNORED_DIRECTORIES.has(dirName)
}

function getRelativePath(clonedPath, absoluteFilePath) {
  const relPath = path.relative(clonedPath, absoluteFilePath);
  return relPath.replace(/\\/g, '/');
}

function getFileStats(absoluteFilePath) {
  try {
    const stats = fs.statSync(absoluteFilePath);
    return { sizeBytes: stats.size, lastModified: stats.mtime };
  } catch (error) {
    return { sizeBytes: 0, lastModified: null };
  }
}

function estimateLinesOfCode(absoluteFilePath) {
  try {
    const content = fs.readFileSync(absoluteFilePath, 'utf8');
    const lines = content.split('\n').length;
    return lines > 10000 ? 10000 : lines;
  } catch (error) {
    return 0;
  }
}

module.exports = {
  isAllowedExtension,
  isIgnoredDirectory,
  getLanguageFromExtension,
  getFileExtension,
  getRelativePath,
  getFileStats,
  estimateLinesOfCode
};
