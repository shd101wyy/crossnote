/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/webview/**/*.{html,js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark'],
  },
};
