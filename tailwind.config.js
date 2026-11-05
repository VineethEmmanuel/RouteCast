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
        app: {
          bg: "#F7F8FA",
          surface: "#FFFFFF",
          subtle: "#F4F5F7",
          border: "#E7EBEF",
          borderHover: "#D4D9DE",
          text: "#17212B",
          muted: "#687582",
          faint: "#9DA7B2",
          accent: "#087E8B",
          accentDark: "#075B65",
          accentLight: "#E6F3F5",
        },
        risk: {
          low: "#16865D",
          lowBg: "#EBF6F1",
          moderate: "#D69B24",
          moderateBg: "#FDF6E7",
          high: "#E47B35",
          highBg: "#FDF1E9",
          severe: "#D94B4B",
          severeBg: "#FCEEEE",
          noTravel: "#861F2D",
          noTravelBg: "#F8E9EB",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(16, 24, 40, 0.04)",
        card: "0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px -1px rgba(16, 24, 40, 0.06)",
        dropdown: "0 4px 20px -2px rgba(16, 24, 40, 0.1), 0 2px 6px -2px rgba(16, 24, 40, 0.06)",
        modal: "0 20px 40px -8px rgba(16, 24, 40, 0.16)",
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
