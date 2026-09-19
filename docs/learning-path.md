# Learning path

This repository is both a working calculator and a small full-stack frontend
template. The fastest way to learn it is to follow one request from the
browser through the development server and then make a small change at each
layer.

## 1. Get a working baseline

From the repository root:

```bash
corepack enable
yarn install
yarn start:dev
```

Open `http://localhost:3000` and try the calculator, the `/about` page, and the
theme toggle. Then run the checks in a second terminal:

```bash
yarn format:check
yarn typecheck
yarn test
yarn build:prd
```

Read [ARCHITECTURE.md](../ARCHITECTURE.md) before changing the server. It
explains which process owns each request.

## 2. Learn the frontend

Start with these files in order:

1. `src/index.tsx` — mounts the SolidJS application.
2. `src/app.tsx` — defines the client-side routes.
3. `src/calculator.tsx` — combines signals, events, API calls, and markup.
4. `src/calculations.ts` — contains UI-independent calculator behavior.
5. `src/index.css` — contains Tailwind, DaisyUI, and local styles.

Suggested exercise: add a calculator history panel. Keep the state in the
component first, then decide whether it belongs in a reusable SolidJS store.
Add a test for the behavior before changing the markup.

## 3. Learn the mock API

Follow the configuration request:

1. `src/calculator.tsx` requests `/config`.
2. The frontend server matches `/config` in `express-serve.config.mjs`.
3. The proxy rewrites it to `/api/config` and forwards it to port 3001.
4. `mock-server/app.mjs` mounts `mock-server/routes/config.mjs`.
5. The response returns through the proxy with the same request ID.

Suggested exercise: add `GET /api/history` to `mock-server/routes/`, mount it
in `mock-server/app.mjs`, and display the result on a new SolidJS route.

## 4. Learn Express middleware and logging

Read these files next:

- `plugins/request-context.mjs` — request IDs and `req.log`.
- `plugins/express-serve-logger.mjs` — Winston and fallback behavior.
- `plugins/example-mocking-plugin.mjs` — an inline route on port 3000.
- `plugins/rollup-plugin-express-serve.mjs` — middleware ordering and proxying.

Suggested exercise: add a middleware that records a request duration and logs
it with `req.log.info()`. Verify that the same request ID appears in both the
frontend and mock-server output.

## 5. Learn the build pipeline

Compare `rollup.config.dev.mjs` and `rollup.config.prd.mjs`:

- Development keeps Rollup running, writes source maps, and attaches the
  serving and live-reload plugins.
- Production removes the old `dist/` directory and emits minified assets.

Suggested exercise: add an asset under `assets/`, confirm that it is copied to
`dist/`, and then inspect the production output with `yarn build:preview`.

## 6. Learn testing and extension points

The tests demonstrate two useful boundaries:

- `test/calculations.test.ts` tests pure behavior without a browser.
- `test/mock-api.test.mjs` starts the Express app on an ephemeral port.
- `test/proxy-utils.test.mjs` tests route rewriting without opening a server.
- `test/logger.test.mjs` tests logging behavior without depending on console UI.

When adding a feature, prefer this order:

1. Extract pure logic where possible.
2. Add a focused unit test.
3. Add an integration test if HTTP behavior changes.
4. Add a browser test only when the interaction itself is the subject.

## 7. Suggested capstone change

Replace the calculator with a small notes application while keeping the
platform pieces:

- Keep Rollup, Express, proxying, request context, logging, and tests.
- Replace `src/calculator.tsx` with a notes route and components.
- Replace the example config route with a notes API route.
- Update `express-serve.config.mjs`, the README, and the architecture diagram.

This demonstrates which parts are template infrastructure and which parts are
application-specific example code.
