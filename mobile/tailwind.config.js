/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["NotoSans_400Regular"],
        "noto-sans": ["NotoSans_400Regular"],
        "noto-sans-medium": ["NotoSans_500Medium"],
        "noto-sans-semibold": ["NotoSans_600SemiBold"],
        "noto-sans-bold": ["NotoSans_700Bold"],
      },
      colors: {
        // Match web app color scheme
        primary: {
          DEFAULT: "#5D3A29", // oklch(0.35 0.0943 18.12) - brownish-red
          foreground: "#F9F5F0",
        },
        background: "#F9F5F0", // cream white
        foreground: "#4A5568", // blue-gray text
        muted: {
          DEFAULT: "#F5F5F5",
          foreground: "#737373", // gray-500 equivalent
        },
        border: "#E5E5E5",
        input: "#E5E5E5",
        destructive: "#DC2626",
      },
    },
  },
  plugins: [],
};
