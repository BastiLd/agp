import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        excel: {
          blue: "#217346",
          "blue-light": "#2E7D32",
          "blue-dark": "#1B5E20",
          gray: "#F5F5F5",
        },
      },
    },
  },
  plugins: [],
};
export default config;

