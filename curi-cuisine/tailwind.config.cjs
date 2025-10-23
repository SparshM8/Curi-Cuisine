module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#F5F7FA", // light background
        secondary: "#D1E8E2", // soft mint
        accent: "#5ED8A3", // premium green
        header: "#2B6777", // deep blue-green
        gold: "#FFD700", // gold accent
        glass: "rgba(255,255,255,0.6)",
        dark: "#22223B",
        "gradient-start": "#F5F7FA",
        "gradient-end": "#A0D8B3"
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"]
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.18)",
        gold: "0 2px 8px 0 #FFD70044"
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #F5F7FA 0%, #A0D8B3 100%)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(160,216,179,0.3) 100%)'
      }
    }
  },
  plugins: []
};
