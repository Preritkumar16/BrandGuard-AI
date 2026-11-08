/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          background: "#0B0F19",
          sidebar: "#0D1220",
          card: "#111827",
          elevated: "#161E2E",
          border: "#253047",
          primary: "#6366F1",
          success: "#10B981",
          danger: "#EF4444",
          warning: "#F59E0B"
        }
      }
    }
  },
  plugins: []
};
