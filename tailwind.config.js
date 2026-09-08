/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f4f1ea",
        mist: "#e7efe8",
        glow: "#efe6d6",
        surface: {
          DEFAULT: "#ffffff",
          2: "#f7f5f0",
          3: "#eeeae2",
        },
        input: "#f7f5f0",
        sidebar: {
          DEFAULT: "#1a2420",
          border: "#2c3b35",
        },
        text: {
          DEFAULT: "#1c2320",
          muted: "#5c6b64",
          subtle: "#8a958f",
          on: "#ffffff",
        },
        primary: {
          DEFAULT: "#2d6a56",
          hover: "#245847",
          pressed: "#1c4638",
          soft: "rgba(45, 106, 86, 0.12)",
        },
        accent: {
          DEFAULT: "#b08a3c",
          soft: "rgba(176, 138, 60, 0.14)",
          bright: "#f0d48a",
        },
        paid: {
          DEFAULT: "#2d6a56",
          soft: "rgba(45, 106, 86, 0.12)",
        },
        pending: {
          DEFAULT: "#c27a2c",
          soft: "rgba(194, 122, 44, 0.14)",
        },
        draft: {
          DEFAULT: "#6b7280",
          soft: "rgba(107, 114, 128, 0.12)",
        },
        danger: {
          DEFAULT: "#c23b3b",
          hover: "#a52f2f",
          soft: "rgba(194, 59, 59, 0.12)",
        },
        border: {
          DEFAULT: "#e4dfd4",
          strong: "#d0c9b8",
        },
        overlay: "rgba(26, 36, 32, 0.48)",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 24px rgba(28, 35, 32, 0.06)",
        hover: "0 16px 36px rgba(45, 106, 86, 0.1)",
        btn: "0 10px 20px rgba(45, 106, 86, 0.22)",
      },
      screens: {
        landing: "1081px",
      },
    },
  },
  plugins: [],
};
