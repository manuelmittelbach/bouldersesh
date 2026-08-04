// Nativer Social-Login (ADR-0016): Apple & Google liefern per SDK einen
// ID-Token, den signInWithIdToken() gegen eine Supabase-Session tauscht — kein
// OAuth-Redirect, kein Deep-Link. Die Session-Gates im Root-Layout übernehmen
// danach die Navigation, genau wie beim Email-Login.
//
// Abbruch durch die Nutzer:in ist KEIN Fehler: beide Funktionen geben dann
// `{ cancelled: true }` zurück, damit die UI still bleibt. Alle anderen Fehler
// fliegen roh raus — `mapAuthError()` übersetzt sie an der Aufrufstelle.

import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';

// Die Google-Client-IDs kommen aus der Google Cloud Console (.env, siehe
// .env.example). Ohne Web-Client-ID gibt es keinen idToken — der Login-Screen
// hält den Google-Button dann deaktiviert, statt zur Laufzeit zu scheitern.
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export const isGoogleSignInConfigured = Boolean(GOOGLE_WEB_CLIENT_ID);

export type SocialSignInResult = { cancelled: boolean };

let googleConfigured = false;

function configureGoogle(): void {
  if (googleConfigured) return;
  GoogleSignin.configure({
    // Die WEB-Client-ID (nicht iOS/Android) — nur sie liefert den idToken,
    // den Supabase verifiziert.
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });
  googleConfigured = true;
}

function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  );
}

export async function signInWithApple(): Promise<SocialSignInResult> {
  // Nonce gegen Token-Replay: Apple bekommt den SHA256-Hash in den Request,
  // Supabase das Original — und prüft, dass der Claim im Token dazu passt.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if (hasErrorCode(error, 'ERR_REQUEST_CANCELED')) return { cancelled: true };
    throw error;
  }

  if (!credential.identityToken) {
    throw new Error('Apple did not return an identity token.');
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;
  return { cancelled: false };
}

export async function signInWithGoogle(): Promise<SocialSignInResult> {
  configureGoogle();
  // No-op auf iOS; auf Android der Standard-Check inkl. Update-Dialog.
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  let response;
  try {
    response = await GoogleSignin.signIn();
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { cancelled: true };
    }
    throw error;
  }
  // Seit v13 meldet das SDK Abbruch als Response-Typ statt als Fehler.
  if (!isSuccessResponse(response)) return { cancelled: true };

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error('Google did not return an ID token.');
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) throw error;
  return { cancelled: false };
}
