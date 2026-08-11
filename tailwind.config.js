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
          DEFAULT: '#009689',  // teal-600 (Figma primary/default)
          hover:   '#005f5a',  // teal-800 (Figma primary/hover)
          light:   '#cbfbf1',  // teal-100 (Figma primary/subdued02)
          subtle:  '#f0fdfa',  // teal-50  (Figma primary/subtle)
          mid:     '#00d5be',  // teal-400 (Figma primary/subdued03)
        },
        muted:   '#90a1b9',    // subdued icons and text (IPA, pin, labels)
        surface: '#f8fafc',    // page background
        dim:     '#6f777f',    // dimmed secondary text (quiz tabs)
        divider: '#dbe0e5',    // soft divider border (quiz tabs)
        line:    '#e2e8f0',    // standard borders
        premium: '#fff085',    // premium crown badge bg (Figma yellow-200)
        quiz: {
          review: '#FF7B3A',   // quiz needs-review status
          hard:   '#C70036',   // quiz weak/hard status (Figma semantic/error/default)
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
