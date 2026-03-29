/* eslint-disable */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Verdant Core (Light Theme) - Complete token set
        primary: {
          DEFAULT: "#006b2c",
          dark: "#62df7d",
        },
        "primary-container": {
          DEFAULT: "#00873a",
          dark: "#1ca64d",
        },
        "on-primary": {
          DEFAULT: "#ffffff",
          dark: "#003916",
        },
        "on-primary-container": {
          DEFAULT: "#f7fff2",
          dark: "#a8f5b8",
        },
        "primary-fixed": {
          DEFAULT: "#a8f5b8",
          dark: "#a8f5b8",
        },
        "primary-fixed-dim": {
          DEFAULT: "#62df7d",
          dark: "#62df7d",
        },

        secondary: {
          DEFAULT: "#006398",
          dark: "#7bd0ff",
        },
        "secondary-container": {
          DEFAULT: "#c8e6ff",
          dark: "#004c6e",
        },
        "on-secondary": {
          DEFAULT: "#ffffff",
          dark: "#003549",
        },
        "on-secondary-container": {
          DEFAULT: "#001e30",
          dark: "#c8e6ff",
        },
        "secondary-fixed": {
          DEFAULT: "#c8e6ff",
          dark: "#c8e6ff",
        },
        "secondary-fixed-dim": {
          DEFAULT: "#7bd0ff",
          dark: "#7bd0ff",
        },

        tertiary: {
          DEFAULT: "#825100",
          dark: "#ffb95f",
        },
        "tertiary-container": {
          DEFAULT: "#ffddb8",
          dark: "#5f3d00",
        },
        "on-tertiary": {
          DEFAULT: "#ffffff",
          dark: "#452b00",
        },
        "on-tertiary-container": {
          DEFAULT: "#2a1700",
          dark: "#ffddb8",
        },
        "tertiary-fixed": {
          DEFAULT: "#ffddb8",
          dark: "#ffddb8",
        },
        "tertiary-fixed-dim": {
          DEFAULT: "#ffb95f",
          dark: "#ffb95f",
        },

        error: {
          DEFAULT: "#ba1a1a",
          dark: "#ffb4ab",
        },
        "error-container": {
          DEFAULT: "#ffdad6",
          dark: "#93000a",
        },
        "on-error": {
          DEFAULT: "#ffffff",
          dark: "#690005",
        },
        "on-error-container": {
          DEFAULT: "#410002",
          dark: "#ffdad6",
        },

        success: {
          DEFAULT: "#006b2c",
          dark: "#62df7d",
        },
        "success-container": {
          DEFAULT: "#a8f5b8",
          dark: "#1ca64d",
        },
        "on-success": {
          DEFAULT: "#ffffff",
          dark: "#003916",
        },
        "on-success-container": {
          DEFAULT: "#003916",
          dark: "#a8f5b8",
        },

        warning: {
          DEFAULT: "#825100",
          dark: "#ffb95f",
        },
        "warning-container": {
          DEFAULT: "#ffddb8",
          dark: "#5f3d00",
        },
        "on-warning": {
          DEFAULT: "#ffffff",
          dark: "#452b00",
        },
        "on-warning-container": {
          DEFAULT: "#2a1700",
          dark: "#ffddb8",
        },

        info: {
          DEFAULT: "#006398",
          dark: "#7bd0ff",
        },
        "info-container": {
          DEFAULT: "#c8e6ff",
          dark: "#004c6e",
        },
        "on-info": {
          DEFAULT: "#ffffff",
          dark: "#003549",
        },
        "on-info-container": {
          DEFAULT: "#001e30",
          dark: "#c8e6ff",
        },

        surface: {
          DEFAULT: "#f8f9fa",
          dark: "#0c1324",
        },
        "surface-dim": {
          DEFAULT: "#d9dadc",
          dark: "#0c1324",
        },
        "surface-bright": {
          DEFAULT: "#f8f9fa",
          dark: "#33394c",
        },
        "surface-container-lowest": {
          DEFAULT: "#ffffff",
          dark: "#070d1f",
        },
        "surface-container-low": {
          DEFAULT: "#f2f3f5",
          dark: "#191f31",
        },
        "surface-container": {
          DEFAULT: "#ecedee",
          dark: "#1d2333",
        },
        "surface-container-high": {
          DEFAULT: "#e6e7e9",
          dark: "#272d3e",
        },
        "surface-container-highest": {
          DEFAULT: "#e1e2e3",
          dark: "#323849",
        },
        "surface-variant": {
          DEFAULT: "#dde4dd",
          dark: "#414946",
        },

        "on-surface": {
          DEFAULT: "#191c1d",
          dark: "#e1e2e3",
        },
        "on-surface-variant": {
          DEFAULT: "#414946",
          dark: "#bdcaba",
        },

        outline: {
          DEFAULT: "#717970",
          dark: "#8b938a",
        },
        "outline-variant": {
          DEFAULT: "#c1c9c0",
          dark: "#414946",
        },

        "inverse-surface": {
          DEFAULT: "#2e3132",
          dark: "#e1e2e3",
        },
        "inverse-on-surface": {
          DEFAULT: "#f0f1f2",
          dark: "#2e3132",
        },
        "inverse-primary": {
          DEFAULT: "#62df7d",
          dark: "#006b2c",
        },

        scrim: {
          DEFAULT: "#000000",
          dark: "#000000",
        },
        shadow: {
          DEFAULT: "#000000",
          dark: "#000000",
        },
      },
      fontFamily: {
        // Manrope for headlines and display text (weights: 400, 600, 700, 800)
        headline: [
          "Manrope_400Regular",
          "Manrope_600SemiBold",
          "Manrope_700Bold",
          "Manrope_800ExtraBold",
          "SF Pro Display",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "Manrope_400Regular",
          "Manrope_600SemiBold",
          "Manrope_700Bold",
          "Manrope_800ExtraBold",
          "SF Pro Display",
          "Roboto",
          "sans-serif",
        ],
        // Inter for body text and labels (weights: 400, 500, 600, 700)
        body: [
          "Inter_400Regular",
          "Inter_500Medium",
          "Inter_600SemiBold",
          "Inter_700Bold",
          "SF Pro Text",
          "Roboto",
          "sans-serif",
        ],
        label: [
          "Inter_400Regular",
          "Inter_500Medium",
          "Inter_600SemiBold",
          "Inter_700Bold",
          "SF Pro Text",
          "Roboto",
          "sans-serif",
        ],
      },
      spacing: {
        2: "0.5rem", // 8px - spacing-2
        4: "1rem", // 16px - spacing-4
        6: "1.5rem", // 24px - spacing-6
        8: "2rem", // 32px - spacing-8
        10: "2.5rem", // 40px - spacing-10
        12: "3rem", // 48px - spacing-12
      },
      borderRadius: {
        sm: "0.5rem", // 8px - for sensor chips
        md: "1.5rem", // 24px - standard rounded
        lg: "2rem", // 32px - cards
        xl: "3rem", // 48px - large elements
        full: "9999px", // pill shape
      },
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        DEFAULT: "12px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "32px",
      },
    },
  },
  plugins: [],
};
