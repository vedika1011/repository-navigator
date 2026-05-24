// pathResolver.js — Resolves raw relative import paths to known ScannedFile ids.

const path = require('path');
const { getLanguageFromExtension } = require('../utils/fileUtils');

const EXTENSION_CANDIDATES_BY_LANGUAGE = {
  javascript: [
    '', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '/index.js', '/index.ts', '/index.jsx', '/index.tsx'
  ],
  typescript: [
    '', '.ts', '.tsx', '.js', '.jsx',
    '/index.ts', '/index.tsx', '/index.js'
  ],
  python: [
    '', '.py', '.pyw', '/__init__.py', '/index.py'
  ],
  ruby: [
    '', '.rb', '/index.rb'
  ],
  php: [
    '', '.php', '/index.php'
  ],
  c: [
    '', '.c', '.h'
  ],
  cpp: [
    '', '.cpp', '.cc', '.cxx', '.h', '.hpp'
  ],
  bash: [
    '', '.sh', '.bash', '.zsh'
  ],
  vue: [
    '', '.vue', '.js', '/index.vue', '/index.js'
  ],
  svelte: [
    '', '.svelte', '.js', '/index.svelte'
  ],
}

// Default fallback
const DEFAULT_CANDIDATES = ['', '.js', '.ts', '.py', '.rb', '.php']

function resolveImport(rawImportPath, importerFile, scannedFiles) {
  try {
    const language = getLanguageFromExtension(importerFile.absolutePath)
    const candidates = EXTENSION_CANDIDATES_BY_LANGUAGE[language]
      || DEFAULT_CANDIDATES

    const importerDir = path.dirname(importerFile.absolutePath)

    // Handle Python relative imports (e.g. .module or ..module)
    let normalizedPath = rawImportPath
    if (language === 'python') {
      // Convert .module to ./module and ..module to ../module
      normalizedPath = rawImportPath
        .replace(/^\.\./, '../')
        .replace(/^\.(?!\.)/, './')
        .replace(/\./g, '/')
    }

    const candidateAbsolute = path.resolve(importerDir, normalizedPath)
    const candidateNorm = candidateAbsolute.replace(/\\/g, '/')

    for (const ext of candidates) {
      const tryPath = (candidateNorm + ext).replace(/\\/g, '/')
      const match = scannedFiles.find(f =>
        f.absolutePath.replace(/\\/g, '/') === tryPath
      )
      if (match) return match.id
    }

    return null
  } catch (err) {
    return null
  }
}

module.exports = { resolveImport };
