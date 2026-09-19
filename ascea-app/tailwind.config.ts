import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ascea: {
          50:  "#eef4fb", 100: "#d6e4f5", 200: "#aec9ea",
          300: "#7ea7db", 400: "#4d83c9", 500: "#2b63ae",
          600: "#1f4d8c", 700: "#1a3f72", 800: "#16335c", 900: "#112647",
        },
      },
      fontFamily: { sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
