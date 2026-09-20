# Plugin and server infrastructure

The `plugins/` folder contains the reusable Express development-server
infrastructure used by the Rollup build and the standalone preview server.
Despite the folder name, not every file is a Rollup plugin. It also contains
middleware, configuration helpers, type declarations, and small utilities.

For the project-wide request flow, see [../ARCHITECTURE.md](../ARCHITECTURE.md).
For practical extension recipes, see [../docs/cookbook.md](../docs/cookbook.md).

## Server flow

```text
rollup.config.dev.mjs
        |
        v
rollup-plugin-express-serve.mjs ----> createServing()
                                          ^
                                          |
express-serve.mjs -----------------------+
standalone CLI
```

During development, Rollup uses the server plugin to serve the generated
application and provide live reload, proxying, and SPA fallback. The
standalone CLI reuses the same `createServing()` implementation for previews
without starting Rollup.

The server configuration is kept at the project root in
`express-serve.config.mjs`.

## Public entry points

| File                                                               | Purpose                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------- |
| [rollup-plugin-express-serve.mjs](rollup-plugin-express-serve.mjs) | Rollup integration and reusable Express server implementation |
| [express-serve.mjs](express-serve.mjs)                             | Standalone CLI for serving an existing build                  |
| [express-serve.md](express-serve.md)                               | Standalone CLI options and examples                           |
| [rollup-plugin-express-serve.md](rollup-plugin-express-serve.md)   | Rollup plugin configuration and usage                         |

The main server implementation exports both the Rollup plugin and
`createServing()`. Use `createServing()` in tests or another Node process when
you need the server without the Rollup lifecycle.

## Supporting modules

| File                                                     | Purpose                                                                                            |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [express-serve-options.mjs](express-serve-options.mjs)   | Normalizes server options such as static roots, proxy rules, SPA fallback, headers, and MIME types |
| [express-serve-devtools.mjs](express-serve-devtools.mjs) | Serves the Chrome DevTools workspace descriptor                                                    |
| [express-serve-logger.mjs](express-serve-logger.mjs)     | Shared Winston/fallback logger with levels, context, and optional file output                      |
| [request-context.mjs](request-context.mjs)               | Adds hyphenated ULID-based `x-request-id` values and exposes the scoped logger as `req.log`       |
| [proxy-path.mjs](proxy-path.mjs)                         | Rewrites proxy paths while preserving query strings and selecting specific routes                  |
| [example-mocking-plugin.mjs](example-mocking-plugin.mjs) | Example frontend-server middleware with lightweight mock routes                                    |

The `.d.ts` files document the JavaScript APIs for editors and TypeScript
consumers:

- `express-serve-options.d.ts` describes the server configuration object.
- `express-serve-controller.d.ts` describes the lifecycle controller returned
  by `createServing()`.
- `express-serve-logger.d.ts` describes logger options and methods.

These declaration files are type information only; they are not loaded at
runtime.

## Where to make changes

- Change ports, static folders, proxy targets, or SPA routes in
  `express-serve.config.mjs`.
- Add reusable server behavior to
  `rollup-plugin-express-serve.mjs` only when it belongs to the general server
  infrastructure.
- Add a lightweight development-only example route to
  `example-mocking-plugin.mjs`.
- Add a real mock API route under `mock-server/routes/` when it should be
  served by the independent mock API process.
- Keep path rewriting in `proxy-path.mjs` so it remains independently
  testable.
- Use `request-context.mjs` and `express-serve-logger.mjs` for request IDs and
  consistent logging instead of creating separate logging behavior.

After changing the server infrastructure, run:

```shell
yarn format:check
yarn lint
yarn check:types
yarn test:node
yarn build:prd
```

The standalone server can then be tested with:

```shell
yarn preview:serve
```
