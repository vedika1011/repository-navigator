// domainDetector.js — Detects logical architecture domains
// from file paths, names, types, and import relationships

const path = require('path')

// Domain detection rules — ordered by specificity
// Each rule has: id, name, icon, keywords, pathPatterns, nodeTypes
const DOMAIN_RULES = [
  // ─── Web Framework Specific ───
  {
    id: 'frontend_ui',
    name: 'UI Components',
    icon: '🖥',
    pathPatterns: [
      '/component', '/components', '/ui', '/views',
      '/pages', '/screens', '/widgets', '/layout',
    ],
    labelPatterns: [
      'component', 'button', 'modal', 'card', 'form',
      'input', 'header', 'footer', 'nav', 'sidebar',
      'menu', 'table', 'list', 'item', 'panel', 'dialog',
    ],
    extensions: ['.jsx', '.tsx', '.vue', '.svelte'],
    nodeTypes: ['route'],
    pascalCaseBonus: true, // React components are PascalCase
  },
  {
    id: 'hooks',
    name: 'Custom Hooks',
    icon: '🪝',
    pathPatterns: ['/hooks', '/hook'],
    labelPatterns: ['use', 'hook'],
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
    nodeTypes: ['middleware'],
    prefixMatch: 'use', // files starting with "use"
  },
  {
    id: 'state_management',
    name: 'State Management',
    icon: '🗃',
    pathPatterns: [
      '/store', '/stores', '/state', '/redux',
      '/context', '/contexts', '/zustand', '/recoil',
      '/mobx', '/flux',
    ],
    labelPatterns: [
      'store', 'reducer', 'action', 'slice', 'context',
      'provider', 'atom', 'selector', 'state',
    ],
    nodeTypes: ['utility'],
  },
  {
    id: 'auth',
    name: 'Authentication',
    icon: '🔐',
    pathPatterns: [
      '/auth', '/authentication', '/login', '/signup',
      '/session', '/token', '/jwt', '/oauth',
      '/permission', '/permissions', '/guard', '/guards',
    ],
    labelPatterns: [
      'auth', 'login', 'logout', 'signup', 'register',
      'token', 'jwt', 'session', 'password', 'credential',
      'permission', 'role', 'guard', 'protect', 'secure',
      'oauth', 'sso',
    ],
    nodeTypes: ['middleware', 'controller'],
  },
  {
    id: 'api_layer',
    name: 'API Layer',
    icon: '🌐',
    pathPatterns: [
      '/api', '/routes', '/route', '/router', '/routers',
      '/endpoint', '/endpoints', '/handler', '/handlers',
      '/controller', '/controllers',
    ],
    labelPatterns: [
      'api', 'route', 'router', 'endpoint', 'handler',
      'controller', 'resource',
    ],
    nodeTypes: ['route', 'controller'],
  },
  {
    id: 'database',
    name: 'Database',
    icon: '🗄',
    pathPatterns: [
      '/model', '/models', '/schema', '/schemas',
      '/migration', '/migrations', '/seed', '/seeds',
      '/repository', '/repositories', '/dao', '/entity',
      '/entities', '/prisma', '/mongoose', '/sequelize',
    ],
    labelPatterns: [
      'model', 'schema', 'migration', 'seed', 'entity',
      'repository', 'dao', 'table', 'collection',
      'mongoose', 'sequelize', 'prisma', 'orm',
    ],
    nodeTypes: ['model'],
  },
  {
    id: 'middleware',
    name: 'Middleware',
    icon: '🛡',
    pathPatterns: [
      '/middleware', '/middlewares', '/interceptor',
      '/interceptors',
    ],
    labelPatterns: [
      'middleware', 'interceptor', 'validator',
      'sanitizer',
    ],
    nodeTypes: ['middleware'],
  },
  {
    id: 'services',
    name: 'Services',
    icon: '⚙',
    pathPatterns: [
      '/service', '/services', '/provider', '/providers',
      '/integration', '/integrations', '/adapter', '/adapters',
    ],
    labelPatterns: [
      'service', 'provider', 'integration', 'adapter',
      'client', 'connector',
    ],
    nodeTypes: ['utility', 'controller'],
  },
  {
    id: 'utilities',
    name: 'Utilities & Helpers',
    icon: '🔧',
    pathPatterns: [
      '/util', '/utils', '/helper', '/helpers',
      '/lib', '/libs', '/shared', '/common',
      '/core', '/base',
    ],
    labelPatterns: [
      'util', 'helper', 'lib', 'common', 'shared',
      'format', 'parse', 'validate', 'transform',
      'convert', 'calculate',
    ],
    nodeTypes: ['utility'],
  },
  {
    id: 'config',
    name: 'Configuration',
    icon: '⚙',
    pathPatterns: [
      '/config', '/configuration', '/settings',
      '/environment', '/env',
    ],
    labelPatterns: [
      'config', 'configuration', 'setting', 'constant',
      'env', 'environment', '.env',
    ],
    nodeTypes: ['config'],
  },
  {
    id: 'testing',
    name: 'Tests',
    icon: '🧪',
    pathPatterns: [
      '/test', '/tests', '/spec', '/specs',
      '/__tests__', '/e2e', '/integration',
    ],
    labelPatterns: [
      'test', 'spec', 'mock', 'fixture', 'stub',
      '.test.', '.spec.',
    ],
    nodeTypes: ['utility'],
    isTest: true,
  },
  {
    id: 'types',
    name: 'Types & Interfaces',
    icon: '📐',
    pathPatterns: [
      '/type', '/types', '/interface', '/interfaces',
      '/dto', '/dtos',
    ],
    labelPatterns: [
      'type', 'types', 'interface', 'dto', 'typings',
    ],
    extensions: ['.ts', '.d.ts'],
    nodeTypes: ['model'],
  },
  {
    id: 'entry',
    name: 'Entry Points',
    icon: '🚀',
    pathPatterns: [],
    labelPatterns: [
      'index', 'main', 'app', 'server', 'bootstrap',
    ],
    nodeTypes: ['entry'],
  },
]

function getSemanticWords(str) {
  // Split camelCase, snake_case, kebab-case, dots
  const formatted = str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/[-_.]/g, ' ')
  return formatted.toLowerCase().split(/\s+/).filter(Boolean)
}

function matchesKeyword(words, pattern) {
  const p = pattern.toLowerCase()
  return words.some(word => {
    if (word === p) return true
    
    // Custom exclusions to avoid false substring/prefix matches
    if (p === 'use' && word.startsWith('user')) return false
    if (p === 'auth' && word.startsWith('author')) return false
    
    return word.startsWith(p)
  })
}

function scoreNodeForDomain(node, rule) {
  let score = 0
  const relativePath = node.id.toLowerCase()
  const label = node.label
  const labelNoExt = label.replace(/\.[^.]+$/, '')
  const words = getSemanticWords(labelNoExt)

  // Path pattern match
  rule.pathPatterns?.forEach(pattern => {
    if (relativePath.includes(pattern.toLowerCase())) {
      score += 10
    }
  })

  // Label pattern match using semantic words
  rule.labelPatterns?.forEach(pattern => {
    if (matchesKeyword(words, pattern)) {
      score += 8
    }
  })

  // Node type match
  if (rule.nodeTypes?.includes(node.type)) {
    score += 3
  }

  // PascalCase bonus (React components)
  if (rule.pascalCaseBonus && /^[A-Z]/.test(node.label)) {
    score += 5
  }

  // Prefix match (e.g. "use" for hooks)
  if (rule.prefixMatch) {
    if (matchesKeyword(words, rule.prefixMatch)) {
      const origLabelNoExt = node.label.replace(/\.[^.]+$/, '')
      const isHookPrefix = /^use[A-Z-]/.test(origLabelNoExt) || relativePath.includes('/hooks/') || relativePath.includes('/hook/')
      if (rule.prefixMatch === 'use' && isHookPrefix) {
        score += 12
      } else if (rule.prefixMatch !== 'use') {
        score += 12
      }
    }
  }

  return score
}

function detectDomains(nodes) {
  if (!nodes || nodes.length === 0) return []

  // Score every node against every domain rule
  const domainFiles = {}
  DOMAIN_RULES.forEach(rule => {
    domainFiles[rule.id] = []
  })

  nodes.forEach(node => {
    // Skip orphaned nodes from domain detection
    if (node.isOrphaned) return

    const scores = DOMAIN_RULES.map(rule => ({
      ruleId: rule.id,
      score: scoreNodeForDomain(node, rule),
    }))

    // Assign node to ALL domains where score > 5
    // (a file can belong to multiple domains)
    scores
      .filter(s => s.score > 5)
      .forEach(s => {
        domainFiles[s.ruleId].push({
          nodeId: node.id,
          label: node.label,
          score: s.score,
        })
      })
  })

  // Build domain objects, filter out empty ones
  const domains = DOMAIN_RULES
    .map(rule => {
      const files = domainFiles[rule.id]
        .sort((a, b) => b.score - a.score)

      if (files.length === 0) return null

      // Get the unique node IDs for this domain
      const nodeIds = [...new Set(files.map(f => f.nodeId))]

      // Find the top files (highest scoring)
      const topFiles = files.slice(0, 5).map(f => f.label)

      // Generate a short domain description
      const description = generateDomainDescription(
        rule, nodeIds.length, topFiles
      )

      return {
        id: rule.id,
        name: rule.name,
        icon: rule.icon,
        description,
        nodeIds,
        fileCount: nodeIds.length,
        topFiles,
        isTest: rule.isTest || false,
      }
    })
    .filter(Boolean)

  // Sort: entry first, tests last, rest by file count
  return domains.sort((a, b) => {
    if (a.id === 'entry') return -1
    if (b.id === 'entry') return 1
    if (a.isTest) return 1
    if (b.isTest) return -1
    return b.fileCount - a.fileCount
  })
}

function generateDomainDescription(rule, fileCount, topFiles) {
  const fileList = topFiles.slice(0, 3).join(', ')
  const descriptions = {
    frontend_ui:
      `User interface components and views. Includes ${fileList} and ${fileCount - 3 > 0 ? fileCount - 3 + ' more' : 'related files'}.`,
    hooks:
      `Custom React hooks for reusable stateful logic. Key hooks: ${fileList}.`,
    state_management:
      `State management and data flow. Manages application-wide state through ${fileList}.`,
    auth:
      `Authentication and authorization logic. Handles login, sessions, and permissions. Key files: ${fileList}.`,
    api_layer:
      `API routes and request handlers. Defines the HTTP interface of the application. Includes ${fileList}.`,
    database:
      `Data models, schemas, and database interactions. Defines the data structure via ${fileList}.`,
    middleware:
      `Request processing middleware. Intercepts and transforms requests through ${fileList}.`,
    services:
      `Business logic services and external integrations. Core services: ${fileList}.`,
    utilities:
      `Shared utilities and helper functions used across the codebase. Includes ${fileList}.`,
    config:
      `Application configuration and environment settings. Configured via ${fileList}.`,
    testing:
      `Test files and test utilities. Covers ${fileCount} test files including ${fileList}.`,
    types:
      `TypeScript types, interfaces, and data transfer objects. Defines ${fileList}.`,
    entry:
      `Application entry points that bootstrap the system. Starts with ${fileList}.`,
  }
  return descriptions[rule.id] ||
    `${fileCount} files related to ${rule.name.toLowerCase()}.`
}

module.exports = { detectDomains }
