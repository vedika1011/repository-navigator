// nodeHelpers.js — Pure utility functions to infer node types, calculate importance, and generate summaries.

const path = require('path');

function inferNodeType(file) {
  const p = file.relativePath.toLowerCase()
  const l = file.label.toLowerCase()
  const ext = path.extname(file.label).toLowerCase()

  // Language detection
  const isPython = ['.py','.pyw'].includes(ext)
  const isJava = ext === '.java'
  const isGo = ext === '.go'
  const isRust = ext === '.rs'

  // Universal: skip tests and examples
  const isTestOrExample = [
    'test','tests','spec','__tests__','fixture',
    'example','examples','demo','mock','mocks',
    '.test.','.spec.','-test.','-spec.',
    // Python test patterns
    'test_','_test',
    // Java test patterns
    'test/java','src/test',
  ].some(s => p.includes(s))

  // Entry points — language aware
  const entryNames = [
    // JS/TS
    'index.js','index.ts','main.js','main.ts',
    'app.js','app.ts','server.js','server.ts',
    // Python
    'main.py','app.py','run.py','manage.py',
    'wsgi.py','asgi.py','__main__.py',
    // Java
    'Main.java','Application.java','App.java',
    // Go
    'main.go',
    // Rust
    'main.rs','lib.rs',
    // Ruby
    'app.rb','main.rb','config.ru',
    // PHP
    'index.php','app.php',
  ]
  if (entryNames.includes(file.label) && !isTestOrExample) return 'entry'

  // Config
  const configPatterns = [
    '/config','/settings','/configuration',
    'config.','settings.','configuration.',
    'webpack','vite','babel','eslint','jest','rollup',
    // Python
    'setup.py','setup.cfg','pyproject.toml',
    'requirements','Pipfile','tox.ini',
    // Java/Kotlin
    'build.gradle','pom.xml','application.properties',
    'application.yml',
    // Go
    'go.mod','go.sum',
    // Rust
    'Cargo.toml',
    // General
    '.env','docker','Dockerfile','docker-compose',
  ]
  if (configPatterns.some(s => p.includes(s) || l.includes(s))) return 'config'

  // Routes / Views / Pages
  const routePatterns = [
    '/route','/router','/routes',
    '/page','/pages','/views','/view',
    '/screen','/screens',
    // Python (Django/Flask)
    '/urls','/views',
    // Java Spring
    '/controller','Controller.java',
    // PHP
    '/routes',
  ]
  if (routePatterns.some(s => p.includes(s) || l.includes(s))) return 'route'

  // Controllers / Handlers
  const controllerPatterns = [
    '/controller','/handler','/action','/resolver',
    'controller','handler','resolver',
    // Python
    '/views.py','views.py','/api/',
    // Java
    'Service.java','ServiceImpl.java',
  ]
  if (controllerPatterns.some(s => p.includes(s) || l.includes(s))) {
    return 'controller'
  }

  // Middleware / Interceptors
  const middlewarePatterns = [
    '/middleware','/interceptor','/guard',
    'middleware','interceptor','guard','auth',
    // Python
    '/decorators','decorator',
    // Java
    'Filter.java','Interceptor.java',
    // General
    'hook','use',
  ]
  if (middlewarePatterns.some(s => p.includes(s) || l.includes(s))) {
    return 'middleware'
  }

  // Models / Data / Schema
  const modelPatterns = [
    '/model','/schema','/entity','/type',
    '/interface','/dto','/struct',
    'model','schema','entity','type','interface',
    // Python
    '/models.py','models.py',
    // Java
    'Entity.java','Model.java','DTO.java',
    // Go
    'struct',
  ]
  if (modelPatterns.some(s => p.includes(s) || l.includes(s))) return 'model'

  // Components (React/Vue/Svelte/etc)
  if (['.vue','.svelte'].includes(ext)) return 'route'
  if (['.jsx','.tsx'].includes(ext) && /^[A-Z]/.test(file.label)) return 'route'
  if (p.includes('/component') || p.includes('/widget') ||
      p.includes('/ui/') || l.includes('component')) return 'route'

  // Utils / Helpers / Libs / Services
  const utilPatterns = [
    '/util','/utils','/helper','/helpers',
    '/lib','/libs','/common','/shared',
    '/service','/services','/api/',
    '/store','/stores',
    'util','helper','service','store',
    'context','provider','constant','format',
    'parse','valid',
    // Python
    '/utils.py','utils.py','/helpers.py',
    // Java
    'Utils.java','Helper.java','Util.java',
  ]
  if (utilPatterns.some(s => p.includes(s) || l.includes(s))) return 'utility'

  return 'utility'
}

function inferImportance(file) {
  const type = inferNodeType(file)
  let score = 4

  if (type === 'entry') score = 9
  else if (type === 'config') score = 7
  else if (type === 'middleware' || type === 'model') score = 6
  else if (type === 'controller' || type === 'route') score = 5

  if (file.depth === 0) score += 1
  if (file.linesOfCode > 200) score += 1
  if (file.linesOfCode > 500) score += 1

  return Math.min(10, Math.max(1, score))
}

function getLanguageLabel(ext) {
  const map = {
    '.py': 'Python', '.java': 'Java', '.go': 'Go',
    '.rs': 'Rust', '.rb': 'Ruby', '.php': 'PHP',
    '.cs': 'C#', '.cpp': 'C++', '.c': 'C',
    '.swift': 'Swift', '.kt': 'Kotlin', '.scala': 'Scala',
    '.sh': 'Shell', '.vue': 'Vue', '.svelte': 'Svelte',
    '.js': 'JavaScript', '.ts': 'TypeScript',
  }
  return map[ext] || 'source'
}

function generatePlaceholderSummary(file) {
  // Return empty string — real summaries come from AI only
  // The frontend handles the empty state display
  return ''
}

module.exports = {
  inferNodeType,
  inferImportance,
  generatePlaceholderSummary
};
