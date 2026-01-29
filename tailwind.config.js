/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#10B981", // Emerald Green
        danger: "#EF4444",  // Red
        glass: "rgba(255, 255, 255, 0.25)",
        glassBorder: "rgba(255, 255, 255, 0.5)",
        glassText: "rgba(0, 0, 0, 0.7)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
