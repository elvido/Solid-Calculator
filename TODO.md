# Project TODOs

The main proxy and logger backlog has been implemented. Remaining work is tracked here.

## Completed

- [x] Replace the hard-coded proxy rewrite with route-aware prefix stripping and explicit rewrites.
- [x] Add lazy logger context support through withContext().
- [x] Preserve variadic logger arguments for Winston and the fallback logger.
- [x] Strip ANSI escape sequences from fallback file output.
- [x] Add request IDs and propagate them through proxy requests.
- [x] Add request-scoped logging through req.log.
- [x] Add logger and proxy unit tests.
- [x] Add LOG_LEVEL environment configuration.
- [x] Fix build:preview to use a one-shot production build.
- [x] Document logger, proxy, request ID, and development workflows.

## Remaining improvements

### Logging and Express integration

- [ ] Consolidate the remaining server verbose flags around the logger level while preserving the ability to suppress server path/browser messages.
- [ ] Add tests for the Winston file transport and fallback logger when Winston is unavailable.
- [ ] Validate production logger behavior and DevTools middleware logging.

### Testing

- [x] Add browser-level tests for calculator input, operator precedence, keyboard shortcuts, theme switching, and error handling.
- [x] Add integration tests for the mock API and proxied `/config` requests.
- [x] Add a CI workflow that runs formatting, type-checking, unit tests, browser tests, and the production build.

### Product and release

- [ ] Persist configuration outside the in-memory mock server.
- [x] Add a release checklist.
- [ ] Publish the next version.
