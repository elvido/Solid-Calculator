# CHANGELOG

## [unreleased]

- **FIXED**: Route-aware proxy rewriting
  - Removed the hard-coded /api/config rewrite
  - Added prefix stripping, explicit rewrites, query preservation, and request ID forwarding
- **IMPROVED**: Logging and request diagnostics
  - Added request-scoped logger context, request IDs, variadic arguments, fallback file output, and LOG_LEVEL
- **IMPROVED**: Calculator behavior
  - Added operator precedence, keyboard input, backspace support, and a visible division-by-zero error state
- **ADDED**: Node unit tests for proxy rewriting and scoped logger behavior
- **ADDED**: Reusable-template documentation, environment configuration, CI, API integration tests, and Playwright browser tests
- **IMPROVED**: Separated calculator logic from the UI and made the mock API independently testable
- **IMPROVED**: Simplified calculator behavior into the typed `src/calculations.ts` module and TypeScript test suite
- **IMPROVED**: Structured Yarn scripts into development, preview, test, check, and format namespaces
- **IMPROVED**: Added a standalone `yarn lint` command and included linting in `yarn check`
- **IMPROVED**: Split Node tests into explicit unit and integration commands
- **CHORE**: Removed unused `MOCK` and `MOCK_MODE` environment variables and their `cross-env` dependency
- **FIXED**: Mock status responses now expose only allowlisted environment metadata while retaining the working directory
- **FIXED**: Production builds no longer emit stale browser-data, Tailwind Node deprecation, or Rollup sourcemap warnings
- **IMPROVED**: Isolated mock API configuration state per app instance and reset browser-test state before each test
- **ADDED**: Production-preview smoke tests for built pages and proxied API routes
- **FIXED**: Production preview now builds once before starting the standalone server
- **IMPROVED**: Modularization of development server setup
  - Extracted Express server logic into reusable `createServing()` utility
  - Enables standalone use and Rollup plugin reuse with shared config
- **IMPROVED**: Config-driven development setup
  - Added `express-serve.config.mjs` for centralized serving configuration
  - Supports middleware, proxy, SPA fallback, and trace logging
- **IMPROVED**: Developer experience
  - Added inline lambdas and helper exports for `printResolvePaths()` and `openPage()`
  - Enables consistent logging and browser launching across environments
- **FIXED**: Rollup plugin lifecycle integration
  - Ensures server is started only once during watch mode
  - Graceful shutdown on termination signals
- **CHORE**: Added JSDoc and extracted `ExpressServeOptions` typedef to `types.mjs`
  - Improves IDE support and config validation

## [v1.0.1]

- **NEW**: Introduced an Express.js-based serving plugin for Rollup, fully backward compatible with @rollup/serve
  - Added support for backend mocking via :
    - Proxy mode: Integrate with an external mocking server (example included).
    - Inline middleware: Configure Express.js-based route handlers directly within the plugin (example included).
- **ADDED**: Integrated ESLint and Prettier into the build process for consistent code quality and formatting.

## [v1.0.0]

- **NEW**: Initial release of Solid-Calculator template
  - Based on SolidJS, TailwindCSS, DaisyUI, Rollup, and Yarn
  - Includes minimal setup for rapid prototyping and extension development
- **ADDED**: Base Rollup config with dev and production variants
- **ADDED**: Tailwind and DaisyUI integration with PostCSS
- **ADDED**: TypeScript support with `tsconfig.json`
- **ADDED**: Basic calculator UI scaffold in `src/`
- **CHORE**: Initial commit with MIT license and clean project structure
