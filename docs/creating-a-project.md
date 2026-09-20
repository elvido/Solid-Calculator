# Creating a project from this template

Use this repository as a starting point when you want a small SolidJS
application with a transparent Rollup build, an Express development server,
proxying, and a mock API.

## Keep the platform

These pieces are intended to be reusable:

- `rollup.config*.mjs`
- `plugins/rollup-plugin-express-serve.mjs`
- `plugins/express-serve.mjs`
- `plugins/proxy-path.mjs`
- `plugins/request-context.mjs`
- `plugins/express-serve-logger.*`
- `mock-server/api-app.mjs` as a starting point for a replaceable API
- `Solid-Calculator.code-workspace` as a starting point for VS Code settings

Read [ARCHITECTURE.md](../ARCHITECTURE.md) before changing middleware order or
proxy routes.

## Replace the example application

1. Create your page and components under `src/`.
2. Replace the routes in `src/app.tsx`.
3. Remove or rename `src/calculator.tsx` and `src/calculations.ts`.
4. Replace the calculator-specific styles in `src/index.css`.
5. Update the browser request paths and API routes.

The calculator is deliberately ordinary application code. It is an example to
replace, not a required part of the server template.

## Replace the mock API

1. Add route modules under `mock-server/routes/`.
2. Mount them in `mock-server/api-app.mjs`.
3. Update `express-serve.config.mjs` when browser paths and backend paths differ.
4. Keep `plugins/example-mocking-plugin.mjs` only for lightweight frontend
   server examples.
5. Replace the in-memory route state with a persistence adapter when needed.

## Update the project identity

Change the name, description, repository metadata, title, icons, and README in
`package.json`, `src/`, `assets/`, and the documentation files. Keep the
architecture and learning documents if they still describe the resulting
project; otherwise update or remove the example-specific sections.
If you choose a different supported Node.js version, update `.node-version`,
`package.json`'s `engines.node`, and the Node version in `.github/workflows/ci.yml`
together.

## Minimum validation before sharing

```shell
yarn install --immutable
yarn check
yarn test:preview
```

Also start the application with `yarn dev`, test the main browser route,
and verify at least one API request through the configured proxy.
