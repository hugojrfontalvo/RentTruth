import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 24px 80px rgba(15, 23, 42, 0.18)",
      },
      colors: {
        ink: "#08111f",
        mist: "#eef4ff",
        cyan: "#6fe8ff",
        coral: "#ff8a65",
      },
      backgroundImage: {
        grid: "linear-gradient(to right, rgba(8,17,31,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(8,17,31,0.06) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
