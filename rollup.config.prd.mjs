// rollup.config.prd.mjs
import { createBaseConfig } from './rollup.config.base.mjs';
import del from 'rollup-plugin-delete';
import terser from '@rollup/plugin-terser';

const baseConfig = createBaseConfig({ sourceMap: false });

export default {
  ...baseConfig,
  output: {
    ...baseConfig.output,
  },
  plugins: [del({ targets: 'dist/**' }), ...baseConfig.plugins, terser()],
};
