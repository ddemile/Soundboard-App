/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        main: "#222222"
      },
      gridTemplateColumns: {
        auto: "repeat(auto-fill, [col-start] minmax(150px, 1fr) [col-end])"
      }
    },
  },
  plugins: [],
}
