/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        leaf: "#2f6f4e",
        moss: "#7b8f3b",
        coral: "#d7664f",
        amber: "#c9861a",
        ink: "#1f2933"
      }
    }
  },
  plugins: []
};
