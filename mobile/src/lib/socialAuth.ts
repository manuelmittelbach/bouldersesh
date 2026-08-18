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

import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

// Die Google-Client-IDs kommen aus der Google Cloud Console (.env, siehe
// .env.example). Ohne Web-Client-ID gibt es keinen idToken — der Login-Screen
// hält den Google-Button dann deaktiviert, statt zur Laufzeit zu scheitern.
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export const isGoogleSignInConfigured = Boolean(GOOGLE_WEB_CLIENT_ID);

export type SocialSignInResult = { cancelled: boolean };

// Reaktives Flag, das das Root-Layout mitliest: solange true, zeigt der Navigator
// den Boot-/Splash-Zustand statt Onboarding. Es überbrückt genau das Zeitfenster
// beim Apple-Login, in dem die Session schon steht, der Apple-Name aber noch nicht
// als display_name persistiert ist — sonst rendert das Namens-Gate für einen
// Sekundenbruchteil, weil der parallele Profil-Fetch in useAuth display_name=null
// zurückgibt, bevor unser Seed-Update greift.
export const PROVISIONING_KEY = ['auth', 'provisioning'] as const;

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

// App-Store-Pflicht (Guideline 4 „Sign in with Apple"): den von Apple gelieferten
// Namen übernehmen, statt ihn danach nochmal abzufragen. Apple sendet `fullName`
// NUR bei der allerersten Autorisierung einer Apple-ID; danach ist er null. Damit
// ein Apple-Login NIE im Namens-Gate hängenbleibt (auch nicht, wenn Apple keinen
// Namen mehr schickt — z. B. ein Prüfer, der dieselbe ID schon getestet hat),
// fällt ein fehlender Name auf „Climber" zurück. Bewusst NICHT auf das E-Mail-
// Präfix: bei „E-Mail verbergen" ist das eine kryptische Relay-Zeichenfolge
// (z. B. „125da") — als Anzeigename unbrauchbar. Der Nutzer kann ihn ohnehin
// jederzeit im Profil ändern.
function appleDisplayName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null,
): string {
  const fromApple = [fullName?.givenName, fullName?.familyName]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .trim();

  return fromApple || 'Climber';
}

// Den frisch getauschten Apple-Namen als display_name setzen und die Auth-Gates
// SOFORT bedienen. Der Session-Wechsel triggert in useAuth parallel einen
// Profil-Fetch (der noch display_name=null läse) — deshalb erst dessen Ergebnis
// verwerfen (cancelQueries) und dann das echte Profil in beide Caches spiegeln,
// exakt wie primeProfileCaches in queries/profiles.ts. So springt das Onboarding-
// Gate gar nicht erst an. `.is('display_name', null)` schützt einen bereits
// gewählten Namen bei Folge-Logins vor dem Überschreiben.
async function seedAppleDisplayName(userId: string, name: string): Promise<void> {
  const { data: updated, error } = await supabase
    .from('profiles')
    .update({ display_name: name })
    .eq('id', userId)
    .is('display_name', null)
    .select()
    .maybeSingle();
  if (error || !updated) return;

  await queryClient.cancelQueries({ queryKey: ['auth', 'profile', userId] });
  queryClient.setQueryData(['auth', 'profile', userId], updated);
  queryClient.setQueryData(['profiles', userId], updated);
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

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;

  // Namen aus dem Apple-Credential übernehmen, bevor das Namens-Gate greifen kann
  // (Guideline 4). Das Provisioning-Flag wird SYNCHRON gesetzt (vor dem ersten
  // await, das an React zurückgibt), damit der Navigator im ganzen Seed-Fenster
  // Splash statt Onboarding zeigt; `finally` gibt es garantiert wieder frei.
  const userId = data.user?.id;
  if (userId) {
    queryClient.setQueryData(PROVISIONING_KEY, true);
    try {
      await seedAppleDisplayName(userId, appleDisplayName(credential.fullName));
    } finally {
      queryClient.setQueryData(PROVISIONING_KEY, false);
    }
  }

  // Apples authorizationCode (~5 min gültig) serverseitig gegen einen
  // Refresh-Token tauschen — den braucht delete-account später für die
  // Token-Revocation (App-Store-Pflicht, ADR-0004-Update). Fire-and-forget:
  // Der Login ist durch, ein Scheitern hier darf ihn nicht mehr anfassen.
  if (credential.authorizationCode) {
    void supabase.functions
      .invoke('apple-token-exchange', {
        body: { authorization_code: credential.authorizationCode },
      })
      .catch(() => {});
  }

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
