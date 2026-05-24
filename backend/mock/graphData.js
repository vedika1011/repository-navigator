// This mock data is no longer used in the main pipeline.
// Kept for reference and potential unit testing in future phases.
// The controller now generates graph data from real scanned files via buildMockGraphFromScan().
// graphData.js — Realistic mock dependency graph modeled after a small Express + Node.js app.

const nodes = [
  {
    id: "src/index.js",
    label: "index.js",
    type: "entry",
    summary: "Application entry point that imports the Express app and starts the HTTP server on the configured port.",
    linesOfCode: 18,
    importance: 10,
    isOrphaned: false,
    dependencyCount: 1,
  },
  {
    id: "src/app.js",
    label: "app.js",
    type: "entry",
    summary: "Configures the Express application with middleware, route mounting, and error handling.",
    linesOfCode: 42,
    importance: 9,
    isOrphaned: false,
    dependencyCount: 4,
  },
  {
    id: "src/routes/users.js",
    label: "users.js",
    type: "route",
    summary: "Defines REST endpoints for user CRUD operations: GET, POST, PUT, DELETE /users.",
    linesOfCode: 35,
    importance: 7,
    isOrphaned: false,
    dependencyCount: 2,
  },
  {
    id: "src/routes/auth.js",
    label: "auth.js",
    type: "route",
    summary: "Defines authentication endpoints for login, register, and token refresh.",
    linesOfCode: 28,
    importance: 7,
    isOrphaned: false,
    dependencyCount: 2,
  },
  {
    id: "src/controllers/userController.js",
    label: "userController.js",
    type: "controller",
    summary: "Handles business logic for user operations including creating, reading, updating, and deleting user records.",
    linesOfCode: 86,
    importance: 6,
    isOrphaned: false,
    dependencyCount: 2,
  },
  {
    id: "src/controllers/authController.js",
    label: "authController.js",
    type: "controller",
    summary: "Handles authentication logic including password verification, JWT token creation, and session management.",
    linesOfCode: 72,
    importance: 6,
    isOrphaned: false,
    dependencyCount: 3,
  },
  {
    id: "src/middleware/authMiddleware.js",
    label: "authMiddleware.js",
    type: "middleware",
    summary: "Validates JWT tokens on protected routes and attaches the decoded user object to the request.",
    linesOfCode: 34,
    importance: 8,
    isOrphaned: false,
    dependencyCount: 1,
  },
  {
    id: "src/models/User.js",
    label: "User.js",
    type: "model",
    summary: "Defines the User data model schema with fields for name, email, password hash, and timestamps.",
    linesOfCode: 45,
    importance: 7,
    isOrphaned: false,
    dependencyCount: 1,
  },
  {
    id: "src/utils/hashPassword.js",
    label: "hashPassword.js",
    type: "utility",
    summary: "Provides functions to hash plaintext passwords and compare them against stored hashes using bcrypt.",
    linesOfCode: 22,
    importance: 4,
    isOrphaned: false,
    dependencyCount: 0,
  },
  {
    id: "src/utils/generateToken.js",
    label: "generateToken.js",
    type: "utility",
    summary: "Creates signed JWT access tokens and refresh tokens with configurable expiration times.",
    linesOfCode: 19,
    importance: 5,
    isOrphaned: false,
    dependencyCount: 0,
  },
  {
    id: "src/config/db.js",
    label: "db.js",
    type: "config",
    summary: "Establishes and exports the database connection using connection string configuration.",
    linesOfCode: 28,
    importance: 8,
    isOrphaned: false,
    dependencyCount: 0,
  },
  {
    id: "src/utils/formatDate.js",
    label: "formatDate.js",
    type: "utility",
    summary: "Formats date objects into human-readable strings for API responses. Currently unused by any module.",
    linesOfCode: 12,
    importance: 1,
    isOrphaned: true,
    dependencyCount: 0,
  },
];

const edges = [
  {
    id: "edge-1",
    source: "src/index.js",
    target: "src/app.js",
    type: "imports",
  },
  {
    id: "edge-2",
    source: "src/app.js",
    target: "src/routes/users.js",
    type: "imports",
  },
  {
    id: "edge-3",
    source: "src/app.js",
    target: "src/routes/auth.js",
    type: "imports",
  },
  {
    id: "edge-4",
    source: "src/app.js",
    target: "src/middleware/authMiddleware.js",
    type: "imports",
  },
  {
    id: "edge-5",
    source: "src/routes/users.js",
    target: "src/controllers/userController.js",
    type: "imports",
  },
  {
    id: "edge-6",
    source: "src/routes/users.js",
    target: "src/middleware/authMiddleware.js",
    type: "imports",
  },
  {
    id: "edge-7",
    source: "src/routes/auth.js",
    target: "src/controllers/authController.js",
    type: "imports",
  },
  {
    id: "edge-8",
    source: "src/routes/auth.js",
    target: "src/middleware/authMiddleware.js",
    type: "imports",
  },
  {
    id: "edge-9",
    source: "src/controllers/userController.js",
    target: "src/models/User.js",
    type: "imports",
  },
  {
    id: "edge-10",
    source: "src/controllers/userController.js",
    target: "src/utils/hashPassword.js",
    type: "calls",
  },
  {
    id: "edge-11",
    source: "src/controllers/authController.js",
    target: "src/models/User.js",
    type: "imports",
  },
  {
    id: "edge-12",
    source: "src/controllers/authController.js",
    target: "src/utils/hashPassword.js",
    type: "calls",
  },
  {
    id: "edge-13",
    source: "src/controllers/authController.js",
    target: "src/utils/generateToken.js",
    type: "calls",
  },
  {
    id: "edge-14",
    source: "src/models/User.js",
    target: "src/config/db.js",
    type: "imports",
  },
  {
    id: "edge-15",
    source: "src/middleware/authMiddleware.js",
    target: "src/utils/generateToken.js",
    type: "calls",
  },
];

const onboardingPath = [
  {
    nodeId: "src/config/db.js",
    order: 1,
    reason: "Start here to understand how the application connects to the database — everything depends on this.",
  },
  {
    nodeId: "src/index.js",
    order: 2,
    reason: "The entry point shows how the server starts and which port it listens on.",
  },
  {
    nodeId: "src/app.js",
    order: 3,
    reason: "The app configuration reveals all middleware and routes — this is the architectural backbone.",
  },
  {
    nodeId: "src/models/User.js",
    order: 4,
    reason: "Understanding the data model is essential before reading any business logic.",
  },
  {
    nodeId: "src/middleware/authMiddleware.js",
    order: 5,
    reason: "Auth middleware is used across multiple routes — understand it before diving into controllers.",
  },
  {
    nodeId: "src/routes/auth.js",
    order: 6,
    reason: "Auth routes show the login and registration flow — a natural starting point for understanding user-facing features.",
  },
  {
    nodeId: "src/controllers/authController.js",
    order: 7,
    reason: "The auth controller contains the core authentication logic including password hashing and token generation.",
  },
  {
    nodeId: "src/routes/users.js",
    order: 8,
    reason: "User routes show the CRUD operations available for managing users.",
  },
  {
    nodeId: "src/controllers/userController.js",
    order: 9,
    reason: "User controller implements the business rules for creating, updating, and deleting users.",
  },
];

const warnings = [
  {
    type: "orphaned_module",
    nodeId: "src/utils/formatDate.js",
    message: "formatDate.js is not imported by any other module — it may be dead code or a leftover from a refactor.",
  },
  {
    type: "high_coupling",
    nodeId: "src/middleware/authMiddleware.js",
    message: "authMiddleware.js is imported by 3 other modules — changes here will have a wide impact across the codebase.",
  },
];

module.exports = { nodes, edges, onboardingPath, warnings };
