/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // supports toggling class='dark' for dark/light themes
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
      colors: {
        // Obsidian dark theme
        bgPrimary: "var(--bg-primary, #090a0f)",
        bgSecondary: "var(--bg-secondary, #12141c)",
        bgTertiary: "var(--bg-tertiary, #191c27)",
        borderColor: "var(--border-color, #212534)",
        borderActive: "var(--border-active, #4a54ff)",
        
        textPrimary: "var(--text-primary, #f8fafc)",
        textSecondary: "var(--text-secondary, #94a3b8)",
        textMuted: "var(--text-muted, #64748b)",
        
        // Status colors
        success: "var(--color-success, #10b981)",
        warning: "var(--color-warning, #f59e0b)",
        danger: "var(--color-danger, #ef4444)",
      },
      boxShadow: {
        glass: "0 4px 30px rgba(0, 0, 0, 0.25)",
      }
    },
  },
  plugins: [],
}
