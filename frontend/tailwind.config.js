/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts}", "./*.html"],
  theme: {
    extend: {
      colors: {
        'powerpuff-pink': '#FF69B4',
        'powerpuff-blue': '#87CEEB',
        'powerpuff-green': '#98FB98',
        'powerpuff-purple': '#DDA0DD',
        'townsville-sky': '#87CEEB',
        'mojo-jojo': '#4A4A4A'
      },
      fontFamily: {
        'logo': ['Luckiest Guy', 'Comic Sans MS', 'cursive'],
        'powerpuff': ['Comic Sans MS', 'Comic Sans', 'cursive']
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 4s linear infinite'
      }
    },
  },
  plugins: [],
} 