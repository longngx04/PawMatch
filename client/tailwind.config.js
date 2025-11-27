/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'paw-green-light': '#87e98c',
        'paw-green': '#25c225',
        'paw-green-bright': '#0feb46',
        'paw-green-border': '#23e02c',
      },
    },
  },
  plugins: [],
}

