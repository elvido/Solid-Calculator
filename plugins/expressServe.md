# 🧩 expressServe.mjs

CLI entry point for `rollup-plugin-express-serve`, enabling standalone server startup with dynamic config resolution. It allows the reuse of your rollup-plugin-express-serve configuration serving you content as standalone server without rollup.

## 🚀 Usage

```bash
node expressServe.mjs --config ./my-config.mjs
```

If no `--config` is provided, it falls back to:

- `express-serve.config.mjs`
- `express-serve.config.js`
- `express-serve.config.cjs`

## 🛠️ CLI Options

| Flag        | Alias | Type    | Description                                                                                                                                                                                       |
|-------------|-------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `--config`  | `-c`  | string  | Path to the config file. Must export a default object.                                                                                                                                            |
| `--folder`  | `-f`  | string  | Static folder(s) to serve. Supports multiple forms: Single folder: `-f public` : Multiple folders: `-f public,assets` : Explicit mappings: `-f public/assets:/assets,public/docs:/docs,root:/`    |
| `--port`    | `-p`  | number  | Port to listen on (overrides config).                                                                                                                                                             |
| `--host`    | `-h`  | string  | Hostname to bind the server to (overrides config).                                                                                                                                                |
| `--open`    | `-o`  | string  | Page/URL to open in the browser after the server starts. Use `-o-` or `--open=false` to disable. Use `-o+` or `--open=true` to open `'/'`. Otherwise pass a path/URL (e.g. `-o /dashboard.html`). |
| `--verbose` | `-v`  | boolean | Enable verbose logging (overrides config).                                                                                                                                                        |
| `--trace`   | `-t`  | boolean | Enable request tracing (overrides config).                                                                                                                                                        |
| `--help`    | `-?`  | boolean | Show help text.                                                                                                                                                                                   |

## 🔍 Config Resolution Logic

```js
// Priority 1: explicit --config path
// Priority 2: fallback to express-serve.config.{mjs,js,cjs}
```

If the file is missing or invalid, the script exits with an error.

## ⚙️ Config Options (same as for rollup-plugin-express-serve)

 Option               | Type                                                                                                        | Default       | Description                                                                                                                                                                          |
|----------------------|-------------------------------------------------------------------------------------------------------------|---------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `contentBase`        | `string` \| `string[]` \| `Record<string,string>`                                                           | `''`          | Static file configuration. A `string` serves one directory at `'/'`. A `string[]` serves multiple directories at `'/'`. A `Record<dir,url>` maps directories to explicit mount URLs. |
| `headers`            | `Record<string, string>`                                                                                    | `undefined`   | Custom headers to apply to all responses.                                                                                                                                            |
| `historyAPIFallback` | `boolean` \| `string` \| `string[]` \| `{ path?: string, routes?: string[] }`                               | `false`       | Enables SPA fallback. `true` serves `index.html`, a `string` serves that file, an array defines fallback routes, or an object sets `path`/`routes`.                                  |
| `host`               | `string`                                                                                                    | `'localhost'` | Hostname to bind the server to.                                                                                                                                                      |
| `https`              | `{ key: string, cert: string }`                                                                             | `undefined`   | HTTPS configuration with paths to key and cert files.                                                                                                                                |
| `middleware`         | `express.RequestHandler[]`                                                                                  | `undefined`   | Additional Express middleware to apply.                                                                                                                                              |
| `mimeTypes`          | `Record<string, string \| string[]>`                                                                        | `undefined`   | Custom MIME type definitions to override or extend defaults.                                                                                                                         |
| `onListening`        | `(server: http.Server \| https.Server) => void`                                                             | `undefined`   | Callback invoked once the server is listening.                                                                                                                                       |
| `openPage`           | `boolean` \| `string`                                                                                       | `false`       | Page to open in the browser after the server starts. `true` opens `'/'`, a `string` opens that specific path or URL.                                                                 |
| `port`               | `number`                                                                                                    | `10001`       | Port to listen on.                                                                                                                                                                   |
| `proxy`              | `Record<string, string \| { target: string, stripPrefix?: boolean }>`                                       | `undefined`   | Proxy configuration: route to target mapping. Supports optional prefix stripping.                                                                                                    |
| `traceRequests`      | `boolean` \| `string` \| { format?: string \| ((tokens, req, res) => string), filter?: string \| string[] } | `false`       | Morgan logging format or configuration. Supports custom format and route filtering using string or array of prefixes.                                                                |
| `verbose`            | `boolean`                                                                                                   | `true`        | Whether to log server and proxy activity.                                                                                                                                            |

## 📦 Example Config File

```js
// express-serve.config.mjs
export default {
  contentBase: 'public',
  port: 3000,
  open: true,
  openPage: '/dashboard',
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      stripPrefix: true
    }
  },
  historyAPIFallback: true,
  verbose: true
};
```

## 🧪 Examples

### Start with custom config

```bash
node expressServe.mjs --config ./dashboard.mjs
```

### Use fallback config

```bash
node expressServe.mjs
# Will try express-serve.config.mjs/js/cjs
```

### Serve single folder at /

```bash
node expressServe.mjs -f public
```

### Serve multiple folders at /

```bash
node expressServe.mjs -f public,assets
```

### Serve multiple folders with explicit mappings

```bash
node expressServe.mjs -f public/assets:/assets,public/docs:/docs,public/root:/
```

### Custom port and host

```bash
node expressServe.mjs -p 4000 -h 0.0.0.0
```

### Open a specific page

```bash
node expressServe.mjs -o /dashboard.html
```

### Disable auto-open

```bash
node expressServe.mjs -o-
```

### Enable tracing and verbose logging

```bash
node expressServe.mjs -t -v
```
