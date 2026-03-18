import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ota: {
          orange: "#FF6B35",
          "orange-light": "#FF8F66",
          "orange-dark": "#E55A25",
          blue: "#1E3A8A",
          "blue-light": "#2B4FA3",
          "blue-dark": "#152C6B",
          teal: "#14B8A6",
          "teal-light": "#2DD4BF",
          "teal-dark": "#0F9A8D",
        },
      },
      fontFamily: {
        bangla: ["Hind Siliguri", "Noto Sans Bengali", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
