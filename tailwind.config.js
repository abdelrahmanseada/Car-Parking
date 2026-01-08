const tokens = require("./src/styles/tokens.json");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "./src/**/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: tokens.colors.brand,
        "brand-dark": tokens.colors.brandDark,
        "brand-muted": tokens.colors.brandMuted,
        accent: tokens.colors.accent,
        "accent-dark": tokens.colors.accentDark,
        surface: tokens.colors.surface,
        "surface-dark": tokens.colors.surfaceDark,
        "surface-elevated": tokens.colors.surfaceElevated,
        "surface-elevated-dark": tokens.colors.surfaceElevatedDark,
        text: tokens.colors.text,
        "text-muted": tokens.colors.textMuted,
        "text-dark-on-surface": tokens.colors.textDarkOnSurface,
        danger: tokens.colors.danger,
        warning: tokens.colors.warning,
        success: tokens.colors.success,
      },
      fontFamily: {
        heading: tokens.fonts.heading.split(","),
        body: tokens.fonts.body.split(","),
      },
      borderRadius: {
        lg: tokens.radius.lg,
        md: tokens.radius.md,
        sm: tokens.radius.sm,
      },
    },
  },
  plugins: [],
};
