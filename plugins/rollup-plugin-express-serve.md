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
      historyApiFallback: true,
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

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `contentBase` | `string` or `string[]` | `''` | Directory or directories to serve static files from |
| `port` | `number` | `10001` | Port to listen on |
| `host` | `string` | `'localhost'` | Hostname to bind the server to |
| `open` | `boolean` | `false` | Whether to open the browser after the server starts |
| `openPage` | `string` | `undefined` | Page to open in the browser (relative path or full URL) |
| `proxy` | `Record<string, string | { target: string, stripPrefix?: boolean }>` | `undefined` | Proxy configuration: route to target mapping. Supports optional prefix stripping. |
| `historyApiFallback` | `boolean` or `string` | `false` | Enable SPA fallback. If `true`, serves `/index.html`. If a string, serves the specified file. |
| `headers` | `Record<string, string>` | `undefined` | Custom headers to apply to all responses |
| `verbose` | `boolean` | `true` | Whether to log server and proxy activity |
| `onListening` | `(server: http.Server | https.Server) => void` | `undefined` | Callback invoked once the server is listening |
| `https` | `{ key: string, cert: string }` | `undefined` | HTTPS configuration with paths to key and cert files |
| `middleware` | `express.RequestHandler[]` | `undefined` | Additional Express middleware to apply |
| `traceRequests` | `string` or `{ format?: string | ((tokens, req, res) => string), filter?: string | string[] }` | `undefined` | Morgan logging format or configuration. Supports custom format and route filtering. |
| `mimeTypes` | `Record<string, string | string[]>` | `undefined` | Custom MIME type definitions to override or extend defaults |

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
historyApiFallback: '/fallback.html'
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
