// JS-Spiegel der Farb-Tokens aus tailwind.config.js — für imperative APIs, die KEINE
// NativeWind-Klassen entgegennehmen: Lucide-Icon-`color`/`fill`, StatusBar, RN-Style-
// Objekte (z. B. die Tab-Bar), ActivityIndicator. Single Source bleibt tailwind.config.js;
// bei Palettenänderungen hier mitziehen. Rohe Skalen 1:1 (keine semantischen Aliase).
export const colors = {
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
  },
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
  grade: {
    beginner: '#e3f3ec',
    beginnerInk: '#1f7a52',
    intermediate: '#e2edf7',
    intermediateInk: '#2664a8',
    advanced: '#fbeed2',
    advancedInk: '#9a6a12',
    pro: '#f9e0e0',
    proInk: '#a92d2d',
  },
  success: '#1f7a52',
  successSurface: '#e3f3ec',
  warning: '#9a6a12',
  warningSurface: '#fbeed2',
  danger: '#b03333',
  dangerSurface: '#f9e0e0',
} as const;
