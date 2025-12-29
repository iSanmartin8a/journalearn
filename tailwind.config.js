/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        typing: {
          "0%": { width: "0" },
          "100%": { width: "14ch" },
        },
        blink: {
          "50%": { borderColor: "transparent" },
        },
      },
      animation: {
        typing: "typing 2.6s steps(14) forwards, blink 1s step-end infinite",
      },
      colors: {
        theme: {
          bg: "var(--theme-bg)",
          title: "var(--theme-title)",
          label: "var(--theme-label)",
          placeholder: "var(--theme-placeholder)",
          invalid: "var(--theme-invalid)",
          valid: "var(--theme-valid)",
          button: "var(--theme-button)",
        },
      },
    },
  },
  plugins: [],
};
