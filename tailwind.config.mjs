import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  plugins: [daisyui],
  daisyui: {
    themes: ['light', 'dark'], // or your custom themes
  },
};
