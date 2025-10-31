# 📦 rollup-plugin-express-serve

Serve static files, proxy APIs, and enable SPA fallback during development — all powered by Express. This plugin is ideal for local dashboards, Smart Home UIs, and reproducible group setups.

## 🚀 Installation

```bash
yarn add -d rollup-plugin-express-serve
```

or

```bash
npm install --save-dev rollup-plugin-express-serve
```

## 🛠️ Usage

```js
// rollup.config.js
import expressServe from 'rollup-plugin-express-serve';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'esm'
  },
  plugins: [
    expressServe({
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
      headers: {
        'Cache-Control': 'no-store'
      },
      mimeTypes: {
        'application/wasm': ['wasm'],
        'text/markdown': ['md']
      },
      traceRequests: {
        format: 'dev',
        filter: ['/api', '/assets']
      }
    })
  ]
};
```

## ⚙️ Plugin Options

| Option               | Type                                                                                                        | Default       | Description                                                                                                                                                                          |
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

## 🧪 Examples

### Proxy with prefix stripping

```js
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    stripPrefix: true
  }
}
```

### SPA fallback to custom file

```js
historyAPIFallback: '/fallback.html'
```

### Custom MIME types

```js
mimeTypes: {
  'application/wasm': ['wasm'],
  'text/markdown': ['md']
}
```

### Trace logging with filter

```js
traceRequests: {
  format: 'dev',
  filter: ['/api', '/assets']
}
```
