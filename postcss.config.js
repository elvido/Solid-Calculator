import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import postcssMinify from 'postcss-minify'; // or postcssCsso, postcssClean

export default {
  plugins: [tailwindcss, autoprefixer, postcssMinify()],
};
