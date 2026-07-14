/** @type {import('tailwindcss').Config} */
module.exports = {
  // Alle Screens & Komponenten unter src/ scannen.
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Platzhalter — Marken-Akzent aus ADR-0001. Der vollstaendige
        // Token-Port (Rock-Neutrals, Fonts, Radien, Motion) aus dem
        // Design System folgt im naechsten Salvage-Schritt.
        'send-orange': '#f25c16',
      },
    },
  },
  plugins: [],
};
