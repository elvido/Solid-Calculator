// rollup.config.base.mjs
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy';
import html from '@rollup/plugin-html';
import typescript from '@rollup/plugin-typescript';
import eslint from '@rollup/plugin-eslint';
import postcssConfig from './postcss.config.mjs';

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

export default {
  input: 'src/index.tsx',
  output: {
    dir: 'dist',
    format: 'es',
    entryFileNames: 'app.js',
    assetFileNames: '[name][extname]',
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
