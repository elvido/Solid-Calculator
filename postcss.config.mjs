// postcss.config.mjs
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import postcssMinify from 'postcss-minify'; // or postcssCsso, postcssClean
import tailwindConfig from './tailwind.config.mjs';

export default {
  plugins: [tailwindcss(tailwindConfig), autoprefixer(), postcssMinify()],
};
