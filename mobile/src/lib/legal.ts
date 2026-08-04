import * as WebBrowser from 'expo-web-browser';

// Gehostet via GitHub Pages aus dem Repo-Ordner website/ (siehe dortiges
// README für Deploy + DNS). Extensionslose Pfade → terms.html/privacy.html.
export const TERMS_URL = 'https://bouldersesh.app/terms';
export const PRIVACY_URL = 'https://bouldersesh.app/privacy';

/** Rechtstext im In-App-Browser öffnen (kein Verlassen der App). */
export function openLegal(url: string): void {
  void WebBrowser.openBrowserAsync(url);
}
