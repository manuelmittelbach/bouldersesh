import * as WebBrowser from 'expo-web-browser';

// PLATZHALTER — echte, gehostete Rechtstexte kommen mit der eigenen Domain
// (ADR-0016: App-Store-Pflicht, aber NICHT fürs Deep-Linking). Bis dahin zeigen
// die Login-Links hierauf. Nur diese zwei Konstanten austauschen, wenn die
// Seiten stehen.
export const TERMS_URL = 'https://boulderbuddy.example/terms';
export const PRIVACY_URL = 'https://boulderbuddy.example/privacy';

/** Rechtstext im In-App-Browser öffnen (kein Verlassen der App). */
export function openLegal(url: string): void {
  void WebBrowser.openBrowserAsync(url);
}
