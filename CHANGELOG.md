# CHANGELOG

## [unreleased]

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
