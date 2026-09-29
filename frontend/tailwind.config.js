/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          900: "#0b132b",
          800: "#1c2541",
          700: "#3a506b",
        },
        cyan: {
          400: "#5bc0be",
          500: "#3a9896",
        },
        accent: {
          blue: "#3b82f6",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#ef4444",
          purple: "#8b5cf6"
        }
      },
    },
  },
  plugins: [],
};
