/**
 * @iconifybeyond/react-native-android-credentials
 *
 * Public JS/TS API — wraps the TurboModule with rich types and platform guards.
 *
 * On non-Android platforms (iOS, web, etc.) all methods reject with a
 * `CredentialError` whose `code` is `'UNSUPPORTED'`, so the JS layer never
 * crashes at import time.
 */

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Types & Enums
// ---------------------------------------------------------------------------

export enum CredentialType {
  Password = 'Password',
  Passkey = 'Passkey',
  Google = 'Google',
}

export interface PasswordCredentialResult {
  type: CredentialType.Password;
  username: string;
  password: string;
}

export interface PasskeyCredentialResult {
  type: CredentialType.Passkey;
  /** WebAuthn assertion response JSON string */
  responseJson: string;
}

export interface GoogleCredentialResult {
  type: CredentialType.Google;
  idToken: string;
  email?: string;
  displayName?: string;
  givenName?: string;
  familyName?: string;
  profilePictureUri?: string;
}

/** Discriminated union returned by `getCredential`. */
export type CredentialResult =
  PasswordCredentialResult | PasskeyCredentialResult | GoogleCredentialResult;

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface GetCredentialOptions {
  /** Include saved passwords in the bottom sheet. Default: true */
  password?: boolean;
  /** Include passkeys in the bottom sheet. Default: true */
  passkey?: boolean;
  /** Include Sign-in with Google in the bottom sheet. Default: false */
  google?: boolean;
  /** JSON string of PublicKeyCredentialRequestOptions (required when passkey: true) */
  passkeyRequestJson?: string;
  /** Google OAuth2 server client ID (required when google: true) */
  googleServerClientId?: string;
  /** Optional nonce for the Google ID token */
  googleNonce?: string;
  /** Automatically select a credential if only one is available */
  autoSelectEnabled?: boolean;
}

export interface SignInWithGoogleOptions {
  /** Google OAuth2 server client ID */
  serverClientId: string;
  /** Optional nonce for the Google ID token */
  nonce?: string;
  /** Automatically select an account if only one is available */
  autoSelectEnabled?: boolean;
  /** Only show accounts already authorised to reduce the auth flow */
  filterByAuthorizedAccounts?: boolean;
}

// ---------------------------------------------------------------------------
// Error model
// ---------------------------------------------------------------------------

export type CredentialErrorCode =
  'USER_CANCELED' | 'NO_CREDENTIAL' | 'INTERRUPTED' | 'UNSUPPORTED' | 'UNKNOWN';

export class CredentialError extends Error {
  readonly code: CredentialErrorCode;

  constructor(message: string, code: CredentialErrorCode) {
    super(message);
    this.name = 'CredentialError';
    this.code = code;
    // Maintain proper prototype chain in compiled JS
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Lazily access the native module so that importing the package on iOS
 *  does NOT throw even if the module is absent. */
function getNativeModule() {
  // Inline require so that module-level evaluation never crashes on iOS.

  return require('./NativeAndroidCredentials')
    .default as import('./NativeAndroidCredentials').Spec;
}

function unsupportedError(): CredentialError {
  return new CredentialError(
    'react-native-android-credentials is only supported on Android.',
    'UNSUPPORTED'
  );
}

/** Map a raw native rejection to a typed CredentialError. */
function mapNativeError(err: unknown): CredentialError {
  if (err instanceof CredentialError) return err;
  const message = err instanceof Error ? err.message : String(err);
  const code = extractCode(message);
  return new CredentialError(message, code);
}

function extractCode(message: string): CredentialErrorCode {
  if (/user.cancel|canceled/i.test(message)) return 'USER_CANCELED';
  if (/no.credential|no_credential/i.test(message)) return 'NO_CREDENTIAL';
  if (/interrupt/i.test(message)) return 'INTERRUPTED';
  if (/unsupported/i.test(message)) return 'UNSUPPORTED';
  return 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Save a username/password credential to the device credential store.
 *
 * Requires Android API 24+.
 */
export async function createPasswordCredential(
  username: string,
  password: string
): Promise<void> {
  if (Platform.OS !== 'android') throw unsupportedError();
  try {
    await getNativeModule().createPasswordCredential(username, password);
  } catch (err) {
    throw mapNativeError(err);
  }
}

/**
 * Register a new passkey (WebAuthn create).
 *
 * @param requestJson - JSON string conforming to PublicKeyCredentialCreationOptions
 *                      (typically provided by your server).
 * @returns JSON string of the PublicKeyCredential registration response to
 *          send back to your server.
 *
 * Effectively requires Android API 28+; Credential Manager will reject on
 * lower API levels.
 */
export async function savePasskey(requestJson: string): Promise<string> {
  if (Platform.OS !== 'android') throw unsupportedError();
  try {
    return await getNativeModule().savePasskey(requestJson);
  } catch (err) {
    throw mapNativeError(err);
  }
}

/**
 * Show the unified Credential Manager bottom sheet, allowing the user to
 * pick a password, passkey, or Google credential.
 *
 * @param options - Controls which credential types are offered.
 */
export async function getCredential(
  options: GetCredentialOptions
): Promise<CredentialResult> {
  if (Platform.OS !== 'android') throw unsupportedError();
  try {
    const raw = await getNativeModule().getCredential(JSON.stringify(options));
    return JSON.parse(raw) as CredentialResult;
  } catch (err) {
    throw mapNativeError(err);
  }
}

/**
 * Sign in with Google using the dedicated bottom-sheet button flow.
 *
 * @param options - Must include a valid `serverClientId`.
 */
export async function signInWithGoogle(
  options: SignInWithGoogleOptions
): Promise<GoogleCredentialResult> {
  if (Platform.OS !== 'android') throw unsupportedError();
  try {
    const raw = await getNativeModule().signInWithGoogle(
      JSON.stringify(options)
    );
    return JSON.parse(raw) as GoogleCredentialResult;
  } catch (err) {
    throw mapNativeError(err);
  }
}

/**
 * Clear the credential state, e.g. after the user signs out.
 */
export async function clearCredentialState(): Promise<void> {
  if (Platform.OS !== 'android') throw unsupportedError();
  try {
    await getNativeModule().clearCredentialState();
  } catch (err) {
    throw mapNativeError(err);
  }
}
