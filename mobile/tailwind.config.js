/** @type {import('tailwindcss').Config} */
// Token-Port aus dem Boulder Buddy Design System (../Boulder Buddy Design System/tokens)
// bzw. app/tailwind.config.ts. Richtung: cool, athletisch, sparsam — Send Orange als
// EIN kräftiger Akzent pro View gegen eine kühle Graphit-"Rock"-Neutralskala; Grades
// lesen als Daten (mono). Rohe Skalen 1:1 übernommen — die App nutzt genau diese Klassen
// (bg-brand-500, text-rock-900, bg-grade-beginner …); kein Dark-Mode (DS liefert nur Light).
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Fonts werden zur Laufzeit via @expo-google-fonts geladen (useFonts in _layout).
      // In RN wählt fontWeight KEINE Custom-Font-Gewichte zuverlässig aus → jedes Gewicht
      // ist eine eigene Familie mit eigenem font-*-Token statt font-semibold o. ä.
      fontFamily: {
        // Body — Inter
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
        // Display / Headlines / Wordmark — Space Grotesk (der "coole" Face)
        display: ['SpaceGrotesk_600SemiBold'],
        'display-medium': ['SpaceGrotesk_500Medium'],
        'display-bold': ['SpaceGrotesk_700Bold'],
        // Grades, Numerik, Timestamps — JetBrains Mono (technischer Akzent)
        mono: ['JetBrainsMono_500Medium'],
        'mono-semibold': ['JetBrainsMono_600SemiBold'],
        'mono-bold': ['JetBrainsMono_700Bold'],
      },
      colors: {
        // Brand — Send Orange (#f25c16), tiefer/kühler als das alte Tailwind-Orange.
        brand: {
          50: '#fff4ed',
          100: '#ffe4d2',
          200: '#fec5a4',
          300: '#fd9d6c',
          400: '#fb7a3c',
          500: '#f25c16',
          600: '#d8480a',
          700: '#b3380c',
          800: '#8f2f11',
          900: '#742a12',
          DEFAULT: '#f25c16',
        },
        // Neutrals — Rock: kühles Graphit mit leichtem Blaustich (Beton, nicht Sand).
        rock: {
          0: '#ffffff',
          25: '#f7f8fa',
          50: '#f1f3f6',
          100: '#e6e9ee',
          200: '#d3d8e0',
          300: '#b2bac6',
          400: '#8b93a3',
          500: '#646c7d',
          600: '#49515f',
          700: '#353b47',
          800: '#23272f',
          900: '#16181d',
          950: '#0e0f13',
        },
        // Climbing-Grade-Bänder — gedämpft, lesen als Daten, nicht als Bonbons.
        grade: {
          beginner: '#e3f3ec',
          'beginner-ink': '#1f7a52',
          intermediate: '#e2edf7',
          'intermediate-ink': '#2664a8',
          advanced: '#fbeed2',
          'advanced-ink': '#9a6a12',
          pro: '#f9e0e0',
          'pro-ink': '#a92d2d',
        },
        success: { DEFAULT: '#1f7a52', surface: '#e3f3ec' },
        warning: { DEFAULT: '#9a6a12', surface: '#fbeed2' },
        danger: { DEFAULT: '#b03333', surface: '#f9e0e0' },
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '12px',
        lg: '14px',
        xl: '20px',
      },
      // Best-effort: NativeWind übersetzt box-shadow → RN-Shadow (iOS) / elevation (Android).
      // Mehrlagige Schatten kollabieren auf eine Lage; der brand-Glow tönt nur auf iOS
      // (Android-elevation ist immer neutral).
      boxShadow: {
        xs: '0 1px 2px rgba(22, 24, 29, 0.06)',
        sm: '0 1px 3px rgba(22, 24, 29, 0.08)',
        md: '0 4px 12px -2px rgba(22, 24, 29, 0.12)',
        lg: '0 12px 28px -8px rgba(22, 24, 29, 0.20)',
        nav: '0 -6px 20px -12px rgba(22, 24, 29, 0.18)',
        // Brand-Glow — reserviert für FAB / Primary-Float.
        brand: '0 10px 24px -8px rgba(242, 92, 22, 0.45)',
      },
    },
  },
  plugins: [],
};
