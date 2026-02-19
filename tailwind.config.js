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
          "0%": { width: "0", opacity: "0" },
          "5%": { opacity: "1" },
          "100%": { width: "11ch", opacity: "1" },
        },
        blink: {
          "0%, 100%": { borderColor: "currentColor" },
          "50%": { borderColor: "transparent" },
        },
        fadein: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        typing: "typing 1.5s steps(11, end) forwards, blink 1.2s ease-in-out infinite",
        fadein: "fadein 0.4s ease-out 0.6s both",
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
