# @iconifybeyond/react-native-android-credentials

> ⚠️ **Status: Alpha / Work in progress.** APIs may change. Not yet production-ready.

[![npm version](https://img.shields.io/npm/v/@iconifybeyond/react-native-android-credentials.svg)](https://www.npmjs.com/package/@iconifybeyond/react-native-android-credentials)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![New Architecture](https://img.shields.io/badge/New%20Architecture-first--class-blue)](https://reactnative.dev/docs/the-new-architecture/landing-page)

**One API for passwords, passkeys, and Sign in with Google on Android — built on the React Native New Architecture.**

A React Native library that wraps Android's [Jetpack Credential Manager](https://developer.android.com/jetpack/androidx/releases/credentials), exposing a single, fully-typed JavaScript/TypeScript API for:

- 🔑 **Passwords** — save and retrieve password credentials
- 🛡️ **Passkeys (FIDO2 / WebAuthn)** — create and authenticate with passkeys
- 🟢 **Sign in with Google** — Google ID token credentials

Built as a **Turbo Module** (React Native New Architecture) from the ground up — no legacy bridge code on the happy path.

---

## ⚠️ Alpha / Work-in-progress

This library is in early development. The core API is defined and the Kotlin implementation is scaffolded, but **it has not yet been tested end-to-end on a physical device.** Use it for experimentation and contributing — not yet for production apps.

- Version `0.x` signals semver instability; breaking changes may happen between minor releases.
- Please [open an issue](https://github.com/iconifybeyond/react-native-android-credentials/issues) if you find bugs or API pain points.

---

## Requirements

| Requirement | Value |
|---|---|
| React Native | `>= 0.73` (New Architecture) |
| Android minSdk | `24` (Credential Manager API level) |
| Passkeys (effective) | Android API `28+` |
| Google Play Services | Required for Sign in with Google |

> **New Architecture is required.** Enable it in your `android/gradle.properties`:
> ```
> newArchEnabled=true
> ```

---

## Installation

```sh
npm install @iconifybeyond/react-native-android-credentials
```

or

```sh
yarn add @iconifybeyond/react-native-android-credentials
```

No manual linking is needed — the module uses React Native auto-linking.

---

## Setup

### Passwords

No extra setup required for password credentials.

### Passkeys (FIDO2 / WebAuthn)

Passkeys require:
1. A **Digital Asset Links** file at `https://your-domain.com/.well-known/assetlinks.json` associating your app with your domain.
2. A backend that issues and validates `PublicKeyCredentialCreationOptions` / `PublicKeyCredentialRequestOptions` JSON.

See [Android Passkey documentation](https://developer.android.com/training/sign-in/passkeys) for details.

### Sign in with Google

1. Create an **OAuth 2.0 Server Client ID** in the [Google Cloud Console](https://console.cloud.google.com/).
2. Add your app's SHA-1 fingerprint to the OAuth client.
3. Pass the `serverClientId` to `signInWithGoogle()` or to `getCredential()`.

---

## Usage

### Save a password

```typescript
import { createPasswordCredential, CredentialError } from '@iconifybeyond/react-native-android-credentials';

try {
  await createPasswordCredential('user@example.com', 'myPassword123');
  console.log('Password saved!');
} catch (err) {
  if (err instanceof CredentialError) {
    console.log('Error code:', err.code); // 'USER_CANCELED' | 'UNKNOWN' | …
  }
}
```

### Create a passkey

```typescript
import { savePasskey } from '@iconifybeyond/react-native-android-credentials';

// requestJson comes from your WebAuthn server (PublicKeyCredentialCreationOptions)
const registrationResponseJson = await savePasskey(requestJson);
// Send registrationResponseJson back to your server to verify and store the credential
```

### Sign in — unified flow (passwords + passkeys + Google)

```typescript
import {
  getCredential,
  CredentialType,
  CredentialError,
} from '@iconifybeyond/react-native-android-credentials';

try {
  const result = await getCredential({
    password: true,
    passkey: true,
    google: true,
    passkeyRequestJson: challengeJsonFromServer,
    googleServerClientId: 'YOUR_SERVER_CLIENT_ID.apps.googleusercontent.com',
    autoSelectEnabled: false,
  });

  switch (result.type) {
    case CredentialType.Password:
      console.log('Password credential:', result.username, result.password);
      break;
    case CredentialType.Passkey:
      console.log('Passkey assertion response:', result.responseJson);
      break;
    case CredentialType.Google:
      console.log('Google ID token:', result.idToken);
      console.log('Email:', result.email);
      break;
  }
} catch (err) {
  if (err instanceof CredentialError && err.code === 'USER_CANCELED') {
    // User dismissed the bottom sheet
  }
}
```

### Sign in with Google (dedicated flow)

```typescript
import { signInWithGoogle } from '@iconifybeyond/react-native-android-credentials';

const result = await signInWithGoogle({
  serverClientId: 'YOUR_SERVER_CLIENT_ID.apps.googleusercontent.com',
  autoSelectEnabled: false,
  filterByAuthorizedAccounts: false,
});

console.log('ID token:', result.idToken);
console.log('Email:', result.email);
console.log('Display name:', result.displayName);
```

### Clear credential state

```typescript
import { clearCredentialState } from '@iconifybeyond/react-native-android-credentials';

// Call on sign-out to clear any cached credential state
await clearCredentialState();
```

### iOS / non-Android platforms

All methods reject with a `CredentialError` whose `code` is `'UNSUPPORTED'` on non-Android platforms — the package never throws at import time.

```typescript
try {
  await createPasswordCredential('user', 'pass');
} catch (err) {
  if (err instanceof CredentialError && err.code === 'UNSUPPORTED') {
    // Running on iOS or another non-Android platform
  }
}
```

---

## API Reference

### `createPasswordCredential(username, password)`

Save a password credential to the Android credential store.

| Parameter | Type | Description |
|---|---|---|
| `username` | `string` | The username or email |
| `password` | `string` | The password |

Returns: `Promise<void>`

---

### `savePasskey(requestJson)`

Register a new passkey (WebAuthn create).

| Parameter | Type | Description |
|---|---|---|
| `requestJson` | `string` | JSON string of `PublicKeyCredentialCreationOptions` |

Returns: `Promise<string>` — JSON string of the registration response to verify server-side.

---

### `getCredential(options)`

Show the unified Credential Manager bottom sheet.

| Option | Type | Default | Description |
|---|---|---|---|
| `password` | `boolean` | `true` | Include saved passwords |
| `passkey` | `boolean` | `true` | Include passkeys |
| `google` | `boolean` | `false` | Include Google credentials |
| `passkeyRequestJson` | `string` | — | Required when `passkey: true` |
| `googleServerClientId` | `string` | — | Required when `google: true` |
| `googleNonce` | `string` | — | Optional nonce |
| `autoSelectEnabled` | `boolean` | `false` | Auto-select if one credential |

Returns: `Promise<CredentialResult>` (discriminated union)

---

### `signInWithGoogle(options)`

Dedicated Sign in with Google bottom-sheet flow.

| Option | Type | Default | Description |
|---|---|---|---|
| `serverClientId` | `string` | — | **Required** Google server client ID |
| `nonce` | `string` | — | Optional nonce |
| `autoSelectEnabled` | `boolean` | `false` | Auto-select if one account |
| `filterByAuthorizedAccounts` | `boolean` | `false` | Only show already-authorized accounts |

Returns: `Promise<GoogleCredentialResult>`

---

### `clearCredentialState()`

Clear the credential state (e.g. on sign-out).

Returns: `Promise<void>`

---

### Types

```typescript
enum CredentialType {
  Password = 'Password',
  Passkey = 'Passkey',
  Google = 'Google',
}

type CredentialResult =
  | { type: CredentialType.Password; username: string; password: string }
  | { type: CredentialType.Passkey; responseJson: string }
  | { type: CredentialType.Google; idToken: string; email?: string; displayName?: string; givenName?: string; familyName?: string; profilePictureUri?: string };

type GoogleCredentialResult = {
  type: CredentialType.Google;
  idToken: string;
  email?: string;
  displayName?: string;
  givenName?: string;
  familyName?: string;
  profilePictureUri?: string;
};
```

### Error Codes

| Code | Meaning |
|---|---|
| `USER_CANCELED` | User dismissed the UI |
| `NO_CREDENTIAL` | No credentials found for this request |
| `INTERRUPTED` | Operation was interrupted (e.g. by another request) |
| `UNSUPPORTED` | Platform is not Android |
| `UNKNOWN` | Unexpected error |

```typescript
import { CredentialError } from '@iconifybeyond/react-native-android-credentials';

try {
  await getCredential({ password: true });
} catch (err) {
  if (err instanceof CredentialError) {
    console.log(err.code); // 'USER_CANCELED' | 'NO_CREDENTIAL' | …
  }
}
```

---

## Roadmap

- ✅ Core library structure (Turbo Module + codegen, New Architecture)
- ✅ TypeScript public API (typed result union, CredentialError)
- ✅ Graceful degradation on iOS / non-Android
- ✅ Password credentials (create + get)
- ⬜ Passkeys — end-to-end device testing
- ⬜ Sign in with Google — end-to-end device testing
- ⬜ Unified `getCredential` — end-to-end device testing
- ⬜ Example app — runnable on emulator/device
- ⬜ iOS support (stub → real WebAuthn via ASAuthorization)
- ⬜ Expo config plugin
- ⬜ Autofill / inline suggestion support
- ⬜ Publish to npm (after core verified)

---

## Contributing

Contributions are very welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

This is an early-stage project — the best contributions right now are:
- Testing on a physical device and filing issues
- Improving error handling and edge cases
- Improving documentation
- Opening PRs against the roadmap items above

---

## License

MIT © iconifybeyond
