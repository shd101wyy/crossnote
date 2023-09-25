/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/webview/**/*.{html,js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  corePlugins: {
    // Disable this because it will pollute the none.css.
    preflight: false,
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          ...require('daisyui/src/theming/themes')['[data-theme=light]'],
          'primary': '#95c258',
          'primary-focus': '#88bb43',
        },
      },
      {
        dark: {
          ...require('daisyui/src/theming/themes')['[data-theme=dark]'],
          'primary': '#6fa129',
          'primary-focus': '#628f25',
        },
      },
    ],
  },
  darkMode: ['class', '[data-theme="dark"]'],
};
