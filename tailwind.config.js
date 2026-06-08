/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00AD82',
          hover:   '#009970',
          light:   '#cbfbf1',
          subtle:  '#f0fdfa',
        },
        secondary: {
          DEFAULT: '#009689',
          hover:   '#007a6f',
        },
        // 境界線・区切り線の標準色
        line: '#e2e8f0',
      },
    },
  },
  plugins: [],
};
