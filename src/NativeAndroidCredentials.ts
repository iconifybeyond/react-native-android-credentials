/**
 * TurboModule spec for AndroidCredentials.
 *
 * Design note: The React Native codegen has limited support for rich union
 * return types in TurboModule specs. To keep codegen happy, all methods that
 * return credential data return `Promise<string>` (a serialised JSON string).
 * The friendly wrappers in `index.ts` parse and normalise those strings into
 * the richly-typed `CredentialResult` / `GoogleCredentialResult` etc.
 */
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Save a password credential to the device credential store.
   */
  createPasswordCredential(username: string, password: string): Promise<void>;

  /**
   * Create (register) a passkey using WebAuthn / FIDO2.
   * @param requestJson - JSON string conforming to PublicKeyCredentialCreationOptions
   * @returns JSON string of the registration response (PublicKeyCredential)
   */
  savePasskey(requestJson: string): Promise<string>;

  /**
   * Retrieve a credential using the unified Credential Manager bottom sheet.
   * @param optionsJson - JSON string of GetCredentialOptions
   * @returns JSON string of CredentialResult
   */
  getCredential(optionsJson: string): Promise<string>;

  /**
   * Sign in with Google using the dedicated button / bottom sheet flow.
   * @param optionsJson - JSON string of SignInWithGoogleOptions
   * @returns JSON string of GoogleCredentialResult
   */
  signInWithGoogle(optionsJson: string): Promise<string>;

  /**
   * Clear the credential state (e.g. on sign-out).
   */
  clearCredentialState(): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('AndroidCredentials');
