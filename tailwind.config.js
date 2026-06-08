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
          light:   '#cbfbf1',  // etymology panel bg, teal-100
          subtle:  '#f0fdfa',  // etymology hook bg, word chip bg, teal-50
          dark:    '#00786f',  // etymology text, teal-700
          mid:     '#00d5be',  // etymology badge border, teal-400
        },
        secondary: {
          DEFAULT: '#009689',  // word chip text, floating btn bg
          hover:   '#007a6f',
        },
        muted:   '#90a1b9',    // subdued icons and text (IPA, pin, labels)
        surface: '#f8fafc',    // page background
        dim:     '#6f777f',    // dimmed secondary text (quiz tabs)
        divider: '#dbe0e5',    // soft divider border (quiz tabs)
        line:    '#e2e8f0',    // standard borders
        quiz: {
          review: '#FF7B3A',   // quiz needs-review status
        },
      },
    },
  },
  plugins: [],
};
