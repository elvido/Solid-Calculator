# Solid Calculator

Solid Calculator is a small single-page application (SPA) built with SolidJS, TypeScript, Tailwind CSS, DaisyUI, and Rollup. It is also a starter project for experimenting with a Rollup/Express development server and mock APIs.

## Prerequisites

- Node.js 22 recommended; the version is pinned in `.node-version` and the minimum supported version is declared in `package.json`
- Corepack enabled
- Yarn 4.10.3 (the version declared by package.json)

Install dependencies from the project root:

~~~bash
corepack enable
yarn install
cp .env.example .env
~~~

The repository includes yarn.lock; keep it in sync when changing dependencies.
`.env` is optional; it provides local overrides for ports, host binding, browser opening, and logging.

## Start the project locally

The normal development command starts both processes required by the application:

~~~bash
yarn start:dev
~~~

This runs:

| Process  | Command             | Purpose                                                                         | Port |
| -------- | ------------------- | ------------------------------------------------------------------------------- | ---- |
| Frontend | yarn start:frontend | Rollup watch build, Express static server, SPA fallback, proxy, and live reload | 3000 |
| Mock API | yarn start:mock     | Nodemon-watched Express mock server                                             | 3001 |

Open [http://localhost:3000](http://localhost:3000). The frontend server opens the browser automatically when the development build is ready.

Useful alternatives:

~~~bash
# Run only the frontend watcher and development server
yarn build:dev

# Run only the mock API
yarn start:mock

# Create a one-shot production build in dist/
yarn build:prd

# Serve an already-built dist/ directory with the standalone server
yarn start:preview
~~~

yarn build:dev is a watch command and stays running. For a one-shot production-like preview, use yarn build:preview; it runs the production build and then starts the standalone preview server.

## Common development workflow

1. Start yarn start:dev from the repository root.
2. Change frontend code in src/; Rollup rebuilds dist/ and the browser reloads.
3. Change mock-server code or routes; Nodemon restarts the mock API.
4. Format changes with yarn format:update.
5. Run yarn format:check and yarn build:prd before committing.
6. Manually smoke-test the calculator and the /about route at http://localhost:3000.

Run yarn test for the automated unit and integration tests. It uses `tsx` so
the suite can execute both TypeScript and JavaScript test files. The production
build also runs TypeScript, ESLint, Babel, PostCSS, and Rollup, so it remains
the main build validation step.

Browser tests use Playwright. Install its local Chromium binary once with
`yarn test:e2e:install`, then run `yarn test:e2e`. The browser test command
starts both development processes automatically.

## How the application is structured

~~~text
src/
  index.tsx       SolidJS entry point; mounts App into #root
  app.tsx         Client-side routes: / and /about
  calculator.tsx  Calculator state, operations, theme, and API calls
  calculations.ts Pure calculator operations and formatting
  about.tsx       About page
  index.css       Tailwind/DaisyUI imports and calculator button styles

mock-server/
  index.mjs       Express mock API on port 3001
  routes/config.mjs  In-memory theme configuration API
  routes/status.mjs  Runtime/system status endpoint
  logger.mjs       Shared logger adapter

plugins/
  rollup-plugin-express-serve.mjs  Express server and proxy implementation
  proxy-utils.mjs                  Proxy path rewrite helpers
  request-context.mjs              Request IDs and scoped request logger
  expressServe.mjs                 Standalone server CLI
  express-serve-devtools.mjs       Chrome DevTools workspace middleware
  example-mocking-plugin.mjs       Inline example routes, including /log

assets/             Favicon, app icons, and web manifest copied to dist/
rollup.config.base.mjs  Shared build pipeline
rollup.config.dev.mjs   Watch-mode server and live reload
rollup.config.prd.mjs   Clean, minified production build
express-serve.config.mjs  Local server, proxy, and middleware configuration
~~~

The build entry is src/index.tsx. Rollup writes the browser bundle and generated CSS to dist/, using app.js, app.css, and generated index.html files. Files in assets/ are copied into dist/.

## Frontend changes

The calculator is intentionally self-contained in src/calculator.tsx:

- Solid signals hold the display, pending operator, expression tokens, pending-input state, and theme.
- onMount() loads the theme from GET /config.
- Theme changes update data-theme on the document and call POST /config.
- Completed calculations are sent to POST /log as plain text.
- Input is limited to 14 digits; multiplication and division take precedence over addition and subtraction.
- Keyboard input is supported: digits, operators, Enter, Escape, Delete, Backspace, decimal point, and percent.
- Division by zero displays Error and can be cleared by entering a new value.

To add a page, create a component under src/ and register it in src/app.tsx:

~~~tsx
<Route path="/settings" component={Settings} />
~~~

If a new route must work when loaded directly in the browser, add it to historyAPIFallback.routes in express-serve.config.mjs or change the fallback configuration to cover all HTML requests.

For reusable visual changes, edit src/index.css. Tailwind and DaisyUI are processed by PostCSS during the Rollup build; do not edit generated files in dist/.

## Mock API and request flow

During development, the browser talks to port 3000. The development server then handles requests as follows:

| Browser request | Development behavior                                                 | Mock endpoint               |
| --------------- | -------------------------------------------------------------------- | --------------------------- |
| GET /config     | Proxied to port 3001 with an explicit rewrite to the API route     | GET /api/config             |
| POST /config    | Same proxy as above                                                  | POST /api/config            |
| GET /api/status | Proxied to port 3001                                                 | GET /api/status             |
| POST /log       | Handled by inline example middleware on port 3000                    | In-memory console audit log |

The configuration route stores its data in memory:

~~~bash
curl http://localhost:3001/api/config
curl -X POST http://localhost:3001/api/config \
  -H 'Content-Type: application/json' \
  -d '{"theme":"dark"}'
curl http://localhost:3001/api/status
~~~

The mock server starts with { "theme": "light" }, so changes are lost when it restarts. The /log endpoint also logs only to the development process; it does not write an audit file or database.

To add a persistent mock route, create a router in mock-server/routes/ and mount it from mock-server/index.mjs. To add a lightweight inline route that belongs to the frontend development server, extend plugins/example-mocking-plugin.mjs and keep it in the middleware array in express-serve.config.mjs.

Every development-server and mock-server request receives an x-request-id response header. The same ID is forwarded through proxy requests, and route handlers can use req.log for context-aware logging:

~~~js
req.log.info('User loaded', { userId: 'demo-user' });
~~~

The logger accepts LOG_LEVEL values error, warn, verbose, info, and debug. For example:

~~~bash
LOG_LEVEL=debug yarn start:dev
~~~

For a reusable project, copy `.env.example` to `.env` and change `FRONTEND_PORT`,
`MOCK_PORT`, `FRONTEND_HOST`, `MOCK_HOST`, or `MOCK_API_URL` instead of editing
server code.

## Build and server configuration

rollup.config.base.mjs contains the shared input, TypeScript, ESLint, Babel, PostCSS, asset-copy, HTML, and source-map configuration.

- rollup.config.dev.mjs adds the Express serving plugin and livereload, and enables watch mode.
- rollup.config.prd.mjs deletes the previous dist/ contents and creates a minified build without source maps.
- express-serve.config.mjs serves dist/ and src/, listens on port 3000, enables /about SPA fallback, enables request tracing, and registers the proxy and example middleware.
- Proxy entries support stripPrefix for generic prefix removal and rewrite for explicit target paths such as /config to /api/config.
- plugins/expressServe.mjs can serve an existing build without Rollup and accepts CLI overrides such as --port, --host, --folder, --open, --verbose, and --trace.

Example standalone server commands:

~~~bash
node ./plugins/expressServe.mjs --help
node ./plugins/expressServe.mjs --config ./express-serve.config.mjs --port 4000
node ./plugins/expressServe.mjs --config ./express-serve.config.mjs --open=false
~~~

More complete option references are available in [plugins/expressServe.md](plugins/expressServe.md) and [plugins/rollup-plugin-express-serve.md](plugins/rollup-plugin-express-serve.md).

## Adding a dependency or changing tooling

1. Edit package.json with Yarn.
2. Run yarn install so yarn.lock is updated.
3. Use the dependency from the appropriate source/config file.
4. Run yarn format:check and yarn build:prd.

Available project scripts are:

| Script              | Description                                                                             |
| ------------------- | --------------------------------------------------------------------------------------- |
| yarn start:dev      | Run frontend watch mode and mock API concurrently                                       |
| yarn start:frontend | Start the frontend watch mode                                                           |
| yarn start:mock     | Start the Nodemon-watched mock API                                                      |
| yarn start:preview  | Serve the existing build through the standalone server                                  |
| yarn build:dev      | Run Rollup in watch mode                                                                |
| yarn build:prd      | Create a clean minified production build                                                |
| yarn build:preview  | Create a production build and serve it through the standalone preview server |
| yarn test            | Run TypeScript and JavaScript unit/integration tests                         |
| yarn typecheck       | Type-check the frontend without emitting files                                  |
| yarn test:e2e        | Run Playwright browser tests                                                    |
| yarn test:e2e:install | Install the Chromium binary used by browser tests                               |
| yarn check           | Run formatting, type-checking, unit tests, and the production build             |
| yarn format:update  | Format repository files with Prettier                                                   |
| yarn format:check   | Check formatting without modifying files                                                |

## Current limitations and follow-up work

- Browser-level tests cover calculator input, operator precedence, theme switching, and error handling; broader end-to-end coverage can be added as the application grows.
- Mock configuration is process-local and resets on restart.
- The project should be kept locally available when stored in OneDrive; online-only dependency files can cause Node read timeouts.

## Documentation map

- [ARCHITECTURE.md](ARCHITECTURE.md): system boundaries, request flows, and extension points
- [docs/creating-a-project.md](docs/creating-a-project.md): turn the repository into a new project
- [docs/learning-path.md](docs/learning-path.md): guided tour and practical exercises
- [docs/decisions.md](docs/decisions.md): important architecture choices and trade-offs
- [docs/release-checklist.md](docs/release-checklist.md): validation and publishing checklist
- [CHANGELOG.md](CHANGELOG.md): release and maintenance history
- [TODO.md](TODO.md): planned fixes and enhancements
- [plugins/expressServe.md](plugins/expressServe.md): standalone Express server CLI
- [plugins/rollup-plugin-express-serve.md](plugins/rollup-plugin-express-serve.md): Rollup plugin options and examples

## License

This project is released under the [MIT License](LICENSE).
