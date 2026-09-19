# Architecture decisions

This document records the choices that shape the template. It is intentionally
short; detailed runtime behavior belongs in [ARCHITECTURE.md](../ARCHITECTURE.md).

## SolidJS and TypeScript for the browser

SolidJS keeps the UI small and reactive without a virtual-DOM update model.
TypeScript gives the application state and browser APIs explicit types while
remaining close to ordinary JavaScript.

## Rollup instead of a framework-specific build tool

Rollup exposes the build stages directly: TypeScript, Babel, PostCSS, asset
copying, HTML generation, minification, and live reload. That makes the
template useful for learning build pipelines and for projects that need a
small custom bundle.

## Express as a reusable development server

The Express server is implemented as a Rollup plugin but can also run through
`plugins/expressServe.mjs`. This keeps static serving, SPA fallback, proxying,
middleware, and request tracing reusable outside the calculator application.

## Separate mock API process

The mock API runs on its own port so frontend code exercises a realistic HTTP
boundary. The app factory in `mock-server/app.mjs` is separate from the
listener in `mock-server/index.mjs`, which makes the API easy to test and
replace with a real backend later.

## Explicit proxy rewrites

Proxy routes support both `stripPrefix` and explicit `rewrite`. Explicit
rewrites make the `/config` to `/api/config` mapping visible in configuration;
the route-aware helper keeps path handling independent and testable.

## Request-scoped logging

Every request receives an ID and a logger context. The ID is returned to the
browser and forwarded to proxied services so a request can be followed across
processes. Winston is preferred when available, with a small fallback logger
for environments where the optional logging dependency is unavailable.

## In-memory mock state

The mock configuration intentionally resets on restart. This keeps the example
dependency-free and makes local development predictable. A real application
should replace the route implementation with a persistence adapter rather than
making the mock server responsible for production data.

## Why the calculator logic is separate

Expression evaluation, formatting, and digit limits do not need SolidJS or a
browser. Keeping them in `src/calculator-logic.mjs` makes the behavior easy to
test and gives learners a clear example of separating domain logic from UI
state.
