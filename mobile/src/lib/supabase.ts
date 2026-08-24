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

// iOS-Netzwerk-Härtung gegen NSURLErrorNetworkConnectionLost (-1005): iOS'
// NSURLSession recycelt Keep-Alive-Sockets, die Supabase/Cloudflare nach kurzer
// Idle-Zeit schon geschlossen haben — der nächste Request läuft in den toten
// Socket und wirft „The network connection was lost", BEVOR er den Server
// erreicht. Das killt vor allem den Signup-Verify: zwischen dem ersten Call beim
// App-Start (frische Verbindung) und der Code-Eingabe vergehen Minuten (App im
// Hintergrund, Mail öffnen) — genau die Idle-Lücke. Ein Retry öffnet eine NEUE
// Verbindung und umgeht den toten Socket. NUR diese transiente, geworfene
// Fehlerklasse wird wiederholt; echte HTTP-Antworten (4xx/5xx) werfen nicht und
// fliegen unberührt durch.
const TRANSIENT_NETWORK_ERROR =
  /network connection was lost|network request failed|the request timed out|connection appears to be offline|software caused connection abort/i;

async function fetchWithRetry(
  ...args: Parameters<typeof fetch>
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetch(...args);
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      if (!TRANSIENT_NETWORK_ERROR.test(message)) throw err;
      // Kurzer Backoff, dann neuer Versuch auf frischer Verbindung.
      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    }
  }
  throw lastError;
}

export const supabase = createClient<Database>(url ?? '', anonKey ?? '', {
  // Alle supabase-js-Requests (Auth, REST, Functions) laufen über den Retry-fetch.
  global: { fetch: fetchWithRetry },
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
