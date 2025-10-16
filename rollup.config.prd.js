import baseConfig from "./rollup.config.base.js";
import del from 'rollup-plugin-delete';
import terser from '@rollup/plugin-terser';

export default {
  ...baseConfig,
  output: {
    ...baseConfig.output,
    sourcemap: false
  },
  plugins: [
    del({ targets: 'dist/**' }),
    ...baseConfig.plugins,
    terser()
  ]
};