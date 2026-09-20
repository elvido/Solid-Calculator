# Project Cookbook

This cookbook is a collection of small, practical recipes for using this
repository as a SolidJS application template. Each recipe focuses on one
change and points to the part of the toolchain that makes it work.

The examples use the existing calculator project, but the patterns are meant
to be copied into a new application. Read [ARCHITECTURE.md](../ARCHITECTURE.md)
when a recipe changes server boundaries or request flow, and use
[creating-a-project.md](creating-a-project.md) when replacing the calculator
with a different application.

## 1. Start with a working baseline

Install the project dependencies and start the development processes:

```bash
corepack enable
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000). The frontend watch
process builds the application into `dist/`, serves it through Express, and
reloads the browser after changes. The mock API runs on port 3001.

Useful commands while learning:

```bash
yarn dev:frontend       # frontend build, server, and live reload
yarn dev:mock           # mock API with Nodemon restarts
yarn format             # format the repository
yarn check              # run the main pre-commit validation
```

If you need to inspect cleanup before removing anything, use
`yarn clean --dry-run`. `yarn clean --fresh` also removes `node_modules`; run
`yarn install` afterward. The project-pinned Yarn release in `.yarn/` and
`yarn.lock` are preserved.

## 2. Render a Hello World component

Solid components are functions that return JSX. Create `src/hello-world.tsx`:

```tsx
export default function HelloWorld() {
  return <h1 class="text-2xl font-bold">Hello, world!</h1>;
}
```

To display it as a page, import it and register a route in `src/app.tsx`:

```tsx
import HelloWorld from './hello-world';

// Inside the Router:
<Route path="/hello" component={HelloWorld} />;
```

Visit [http://localhost:3000/hello](http://localhost:3000/hello). Rollup
rebuilds the bundle when the file changes. The `class` attribute is intentional:
Solid JSX uses DOM-style attributes and Tailwind processes the class names in
the source files.

## 3. Add reactive behavior with SolidJS

Use `createSignal` for local reactive state. Signals are read by calling them
as functions, which lets Solid track exactly which parts of the UI depend on
them:

```tsx
import { createSignal } from 'solid-js';

export default function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <button class="btn btn-primary" onClick={() => setCount(count() + 1)}>
      Clicks: {count()}
    </button>
  );
}
```

Use `onMount` for one-time browser work, such as loading initial configuration.
Use `createEffect` when a side effect should react to a signal. The calculator
uses the same ideas for its display, pending operator, theme, and API-backed
configuration.

## 4. Style a component with Tailwind and DaisyUI

Tailwind utility classes and DaisyUI component classes can be combined:

```tsx
<section class="card bg-base-200 p-6 shadow-xl">
  <h2 class="card-title">Welcome</h2>
  <p class="py-4 text-base-content/70">A reusable template example.</p>
  <button class="btn btn-primary">Continue</button>
</section>
```

For repeated visual behavior, add a local class or reusable component in
`src/`. Keep global imports and project-specific styles in `src/index.css`.
Do not edit generated files in `dist/`; they are recreated by Rollup.

## 5. Add a page and make direct navigation work

Create a component in `src/settings.tsx` and register it in `src/app.tsx`:

```tsx
import Settings from './settings';

<Route path="/settings" component={Settings} />;
```

Add `/settings` to `historyAPIFallback.routes` in
`express-serve.config.mjs` when the page must also work after a direct browser
navigation or refresh:

```js
historyAPIFallback: { path: 'dist', routes: ['/about', '/settings'] },
```

This is needed because the browser requests `/settings` from the server before
the client-side router can select the component.

## 6. Keep business logic independent from the UI

Pure behavior belongs in a TypeScript module when it can be tested without a
browser. For example, `src/calculations.ts` contains calculator operations and
formatting separately from `src/calculator.tsx`.

The same pattern works for a new feature:

```ts
export function formatGreeting(name: string): string {
  return `Hello, ${name.trim()}!`;
}
```

Import the function from a component when it is needed for rendering, and
test it directly in `test/`. Extract code when the behavior is reusable,
independently testable, or separate from rendering concerns.

## 7. Add a mock API route

The development request flow is:

```text
Browser :3000 -> frontend proxy -> mock API :3001
```

Create `mock-server/routes/greeting.mjs`:

```js
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Hello from the mock API' });
});

export default router;
```

Mount it in `mock-server/api-app.mjs`:

```js
import greetingRoute from './routes/greeting.mjs';

app.use('/api/greeting', greetingRoute);
```

The existing `/api` proxy already forwards that path to the mock server. Test
it directly while both development processes are running:

```bash
curl http://localhost:3001/api/greeting
```

From the browser, request `/api/greeting` through port 3000 so the frontend
uses the same proxy boundary as the application:

```ts
const response = await fetch('/api/greeting');
const data = await response.json();
```

Keep route state in a factory when tests need isolated application instances;
`createMockApp()` and the configuration route demonstrate this pattern.

## 8. Add a lightweight frontend-server route

Not every example needs a separate mock API route. Lightweight development-only
routes that belong to the frontend server can be added to
`plugins/example-mocking-plugin.mjs` and kept in the middleware list in
`express-serve.config.mjs`.

Use this for examples such as an in-memory audit log. Use
`mock-server/routes/` when the behavior represents a backend API that should be
proxied or tested as an independent server.

## 9. Use request IDs and logging

The request-context middleware assigns or preserves an `x-request-id` header.
Route handlers can use the request-scoped logger:

```js
req.log.info('Greeting requested', { requestId: req.requestId });
```

The same ID travels through frontend proxy requests and the mock API. Supported
log levels are `error`, `warn`, `verbose`, `info`, and `debug`:

```bash
LOG_LEVEL=debug yarn dev
```

Use `.env.example` for stable project defaults and `.env` for local overrides.

## 10. Choose the right test layer

Start with the smallest test that proves the behavior:

| Behavior                             | Test layer         | Example command         |
| ------------------------------------ | ------------------ | ----------------------- |
| Pure calculation or formatter        | Unit test          | `yarn test:unit`        |
| HTTP route or proxy behavior         | Integration test   | `yarn test:integration` |
| Full user interaction in a browser   | Browser test       | `yarn test:browser`     |
| Built application and preview server | Preview smoke test | `yarn test:preview`     |

Unit tests can run without opening a server. Integration tests create HTTP
servers on ephemeral ports. Browser tests install and use Chromium:

```bash
yarn test:browser:install
yarn test:browser
```

Prefer unit tests for pure logic, integration tests for server boundaries, and
browser tests when the interaction itself is what matters.

## 11. Build and preview the application

Use the watch build during development and a clean production build before
sharing the application:

```bash
yarn build:dev           # watch mode; normally run through yarn dev
yarn build:prd           # clean, minified build in dist/
yarn preview:serve       # serve an existing dist/
yarn preview             # build production output, then serve it
```

The production build uses `rollup.config.prd.mjs`, removes stale generated
output, and emits the static application. The standalone preview server can
also proxy `/api` and `/config` to the configured mock API. Start the mock API
in a second terminal with `yarn dev:mock` when you need those proxied routes.
The mock status endpoint is then available at:

```text
http://localhost:3001/api/status
```

## 12. Adapt the template to a new project

When the example calculator is no longer needed:

1. Change the project identity and metadata in `package.json`.
2. Replace the routes and components under `src/`.
3. Remove or rename calculator-specific files and styles.
4. Replace or remove the mock API routes under `mock-server/routes/`.
5. Update proxy paths in `express-serve.config.mjs`.
6. Update `.env.example`, the README, and `ARCHITECTURE.md`.
7. Keep the build, server, logging, and test infrastructure that remains useful.
8. Run `yarn check` and `yarn test:preview` before sharing the project.

The calculator is example application code. Rollup, the Express development
server, proxying, request context, logging, and the testing layers are the
reusable platform pieces.
