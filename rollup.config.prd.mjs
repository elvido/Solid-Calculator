// rollup.config.prd.mjs
import baseConfig from './rollup.config.base.mjs';
import del from 'rollup-plugin-delete';
import terser from '@rollup/plugin-terser';

export default {
  ...baseConfig,
  output: {
    ...baseConfig.output,
    sourcemap: false,
  },
  plugins: [del({ targets: 'dist/**' }), ...baseConfig.plugins, terser()],
};
