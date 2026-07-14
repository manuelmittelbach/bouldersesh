// url-polyfill MUSS vor dem supabase-js-Import geladen werden: React Native
// hat kein vollständiges URL/URLSearchParams, das Realtime & Storage brauchen.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import type { Database } from '@/types/database';

// Expo inlined nur STATISCH referenzierte EXPO_PUBLIC_*-Variablen zur Build-Zeit.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Laut scheitern im Dev, damit ein fehlendes .env nicht stumm die Auth bricht.
  // eslint-disable-next-line no-console
  console.error(
    'Fehlende EXPO_PUBLIC_SUPABASE_URL oder EXPO_PUBLIC_SUPABASE_ANON_KEY. .env.example nach .env kopieren.',
  );
}

export const supabase = createClient<Database>(url ?? '', anonKey ?? '', {
  auth: {
    // Session in AsyncStorage statt Browser-localStorage.
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    // Kein OAuth-Redirect-Parsing aus der URL — Magic-Link-Deep-Links
    // behandeln wir später explizit über expo-linking.
    detectSessionInUrl: false,
  },
});

// In RN laufen Timer im Hintergrund nicht zuverlässig: Auto-Refresh nur
// starten, während die App aktiv ist (empfohlenes supabase-js-RN-Muster).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
