// rollup.config.dev.mjs
import baseConfig from './rollup.config.base.mjs';
import expressServe from './plugins/rollup-plugin-express-serve.mjs';
import livereload from 'rollup-plugin-livereload';
import expressServeConfig from './express-serve.config.mjs';

export default {
  ...baseConfig,
  output: {
    ...baseConfig.output,
    sourcemap: true,
  },
  plugins: [
    ...baseConfig.plugins,
    expressServe(expressServeConfig),
    livereload({
      watch: 'dist',
      verbose: true,
      delay: 500,
    }),
  ],
  watch: {
    ...baseConfig.watch,
    chokidar: true,
    clearScreen: false,
    buildDelay: 500,
    skipWrite: false,
  },
};
