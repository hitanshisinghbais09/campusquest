/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        night: "#0B0A1E",
        gold: "#F5C96A",
        arcane: "#8B5CF6",
        mist: "#A79CC8",
      },
      fontFamily: {
        display: ["Cinzel", "Georgia", "serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
