# Release checklist

Use this checklist when publishing a reusable project or a new application
version from the template.

## Before release

- [ ] Update `version` and release notes in `package.json` and `CHANGELOG.md`.
- [ ] Confirm `.node-version`, `package.json`'s `engines.node`, and CI use the
      intended Node.js versions.
- [ ] Confirm the repository metadata, title, license, icons, and README match
      the project.
- [ ] Review `.env.example` and remove environment variables that are not
      relevant to the project.
- [ ] Review `ARCHITECTURE.md`, the learning path, and the project-specific
      sections of the README.
- [ ] Ensure no secrets, `.env` files, generated `dist/` files, logs, or test
      reports are committed.

## Validation

```bash
yarn install --immutable
yarn check
yarn test:e2e:install
yarn test:e2e
yarn build:preview
```

Smoke-test the production preview in a browser, including the main route,
client-side routes, API requests, and any configured proxy routes.

## After release

- [ ] Add a concise entry to `CHANGELOG.md`.
- [ ] Tag or publish the version according to the repository workflow.
- [ ] Confirm the CI workflow passed for the release commit.
- [ ] Record any deferred work in `TODO.md`.
