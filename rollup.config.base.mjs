// rollup.config.base.mjs
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy';
import html from '@rollup/plugin-html';
import typescript from '@rollup/plugin-typescript';
import eslint from '@rollup/plugin-eslint';
import postcssConfig from './postcss.config.mjs';
import path from 'path';

const baseHtml = (title, styles, scripts) =>
  `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="manifest" href="/manifest.json">
    <title>${title}</title>
    ${styles}
  </head>
  <body>
    <div id="root"></div>
    ${scripts}
  </body>
</html>
`;

// Mapping table to rewrite or strip specific path prefixes in sourcemaps
const transformSourceMapping = {
  '../src': '', // Strip 'src/' completely
  '../node_modules': 'modules', // Example: rewrite 'node_modules/' to 'modules/' for clarity
};

// Transform the pathnames of source file in sourcemaps
// eslint-disable-next-line no-unused-vars
const transformSourcePath = (relativeSourcePath, sourcemapPath) => {
  const normalizedPath = path.normalize(relativeSourcePath);
  console.log(`[INFO] relativeSourcePath: ${relativeSourcePath} -> ${normalizedPath}`);
  for (const [prefix, rewrite] of Object.entries(transformSourceMapping)) {
    const normalizedPrefix = path.normalize(prefix) + path.sep;
    console.log(`[INFO] normalizedPrefix: ${normalizedPrefix}`);
    if (normalizedPath.startsWith(normalizedPrefix)) {
      // Compute relative path from the matched prefix
      const relativePath = path.relative(normalizedPrefix, normalizedPath);
      console.log(
        `[INFO] path changed: ${relativePath} -> ${rewrite ? path.join(path.normalize(rewrite), relativePath) : relativePath}`
      );
      return rewrite ? path.join(path.normalize(rewrite), relativePath) : relativePath;
    }
  }
  console.log(`[INFO] path is unchanged: ${normalizedPath}`);
  return normalizedPath;
};

export default {
  input: 'src/index.tsx',
  output: {
    dir: 'dist',
    format: 'es',
    entryFileNames: 'app.js',
    assetFileNames: '[name][extname]',
    sourcemap: true,
    sourcemapPathTransform: transformSourcePath,
  },
  plugins: [
    resolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    typescript(),
    eslint({
      include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
      throwOnError: true,
      throwOnWarning: false,
    }),
    babel({
      presets: ['babel-preset-solid'],
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      sourceMaps: true,
    }),
    postcss({
      ...postcssConfig,
      extract: 'app.css',
      minimize: true,
      sourceMap: true,
    }),
    copy({
      targets: [{ src: 'assets/*.*', dest: 'dist' }],
      copyOnce: true,
      verbose: true,
    }),
    html({
      title: 'Solid Calculator',
      template: ({ attributes, files, meta, publicPath, title }) => {
        const scripts = (files.js || [])
          .map(({ fileName }) => `<script type="module" src="${publicPath}${fileName}"></script>`)
          .join('\n');
        const styles = (files.css || [])
          .map(({ fileName }) => `<link rel="stylesheet" href="${publicPath}${fileName}">`)
          .join('\n');
        return baseHtml(title, styles, scripts);
      },
    }),
  ],
  external: [],
  watch: {
    include: ['src/**', 'assets/**'],
    exclude: ['dist/**', 'node_modules/**'],
  },
};
