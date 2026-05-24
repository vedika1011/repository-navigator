// importExtractor.js — Extracts import/dependency statements from
// source files using language-specific regex patterns

const fs = require('fs')
const path = require('path')
const { getLanguageFromExtension } = require('../utils/fileUtils')

// Regex patterns per language
const PATTERNS = {
  javascript: [
    // ES module static import
    /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g,
    // Dynamic import
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    // CommonJS require
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    // Export from
    /export\s+(?:[\w*{}\s,]+\s+)?from\s+['"]([^'"]+)['"]/g,
  ],
  typescript: [
    /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /export\s+(?:[\w*{}\s,]+\s+)?from\s+['"]([^'"]+)['"]/g,
    // Triple-slash reference
    /\/\/\/\s*<reference\s+path=['"]([^'"]+)['"]/g,
  ],
  python: [
    // from module import something
    /^from\s+([\w.]+)\s+import/gm,
    // import module
    /^import\s+([\w.]+)/gm,
  ],
  java: [
    // import com.example.ClassName;
    /^import\s+([\w.]+);/gm,
  ],
  c: [
    // #include "local.h" — only local includes (quoted)
    /#include\s+"([^"]+)"/g,
  ],
  cpp: [
    /#include\s+"([^"]+)"/g,
  ],
  csharp: [
    // using Namespace.Class;
    /^using\s+([\w.]+);/gm,
  ],
  go: [
    // import "path/to/package" or import ( "path" )
    /import\s+"([^"]+)"/g,
    /import\s+\w+\s+"([^"]+)"/g,
  ],
  rust: [
    // use crate::module or mod module
    /^use\s+([\w:]+)/gm,
    /^mod\s+(\w+)/gm,
  ],
  ruby: [
    // require 'file' or require_relative 'file'
    /require_relative\s+['"]([^'"]+)['"]/g,
    /require\s+['"]([^'"]+)['"]/g,
  ],
  php: [
    // require/include with quotes
    /(?:require|include)(?:_once)?\s+['"]([^'"]+)['"]/g,
    // use Namespace\Class;
    /^use\s+([\w\\]+)/gm,
  ],
  swift: [
    /^import\s+(\w+)/gm,
  ],
  kotlin: [
    /^import\s+([\w.]+)/gm,
  ],
  scala: [
    /^import\s+([\w.]+)/gm,
  ],
  bash: [
    // source ./file or . ./file
    /(?:source|\\.)\s+([^\s;]+)/g,
  ],
  vue: [
    // Same as JS/TS
    /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ],
  svelte: [
    /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g,
  ],
}

function isRelativePath(importPath, language) {
  // JS/TS/Vue/Svelte: relative paths start with ./ or ../
  if (['javascript','typescript','vue','svelte'].includes(language)) {
    return importPath.startsWith('./') || importPath.startsWith('../')
  }
  // Python: relative imports start with . (e.g. .module or ..module)
  if (language === 'python') {
    return importPath.startsWith('.')
  }
  // C/C++: all #include "quoted" are local
  if (['c','cpp'].includes(language)) {
    return true
  }
  // Ruby: require_relative is always relative
  // For plain require, check if it doesn't look like a gem name
  if (language === 'ruby') {
    return importPath.startsWith('./') ||
           importPath.startsWith('../') ||
           (!importPath.includes('/') === false)
  }
  // PHP: relative if starts with ./ or ../
  if (language === 'php') {
    return importPath.startsWith('./') ||
           importPath.startsWith('../') ||
           importPath.startsWith('/')
  }
  // Bash: relative paths
  if (language === 'bash') {
    return importPath.startsWith('./') ||
           importPath.startsWith('../') ||
           importPath.startsWith('/')
  }
  // For Java, Go, C#, Rust, Swift, Kotlin, Scala:
  // package imports are NOT relative file paths
  // we can't resolve them to files without a build system
  // return false to skip them (no edges for these)
  return false
}

function extractImports(absolutePath) {
  try {
    const language = getLanguageFromExtension(absolutePath)
    const patterns = PATTERNS[language] || PATTERNS['javascript']

    let content
    try {
      content = fs.readFileSync(absolutePath, 'utf8')
    } catch (err) {
      console.warn(`[ImportExtractor] Cannot read: ${absolutePath}`)
      return []
    }

    const rawPaths = new Set()

    patterns.forEach(pattern => {
      const regex = new RegExp(pattern.source, pattern.flags)
      let match
      while ((match = regex.exec(content)) !== null) {
        if (match[1]) rawPaths.add(match[1].trim())
      }
    })

    // Filter to relative/local imports only
    const filtered = [...rawPaths].filter(p =>
      p && p.length > 0 && isRelativePath(p, language)
    )

    return filtered

  } catch (err) {
    console.warn(`[ImportExtractor] Error processing ${absolutePath}: ${err.message}`)
    return []
  }
}

module.exports = { extractImports }
