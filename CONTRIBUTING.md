# Contributing to react-native-android-credentials

Thank you for your interest in contributing! 🎉

This is an early-stage library — all contributions are welcome, from bug reports and documentation improvements to new features.

## Development setup

1. **Clone the repo**
   ```sh
   git clone https://github.com/iconifybeyond/react-native-android-credentials.git
   cd react-native-android-credentials
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Build the library**
   ```sh
   npm run build
   ```

4. **Typecheck**
   ```sh
   npm run typecheck
   ```

5. **Lint**
   ```sh
   npm run lint
   ```

## Running the example app

```sh
cd example
npm install
cd android && ./gradlew assembleDebug
# or: npx react-native run-android (from example/)
```

> ⚠️ The example app requires a physical or virtual Android device (API 24+). Replace the placeholder `GOOGLE_SERVER_CLIENT_ID` and passkey challenge JSON with values from your own backend before testing Sign in with Google or passkeys.

## Project structure

```
├── src/                    # TypeScript source
│   ├── NativeAndroidCredentials.ts   # Turbo Module spec (codegen)
│   └── index.ts            # Public API + type wrappers
├── android/                # Kotlin native implementation
│   ├── build.gradle
│   └── src/
│       ├── main/java/com/iconifybeyond/androidcredentials/
│       │   ├── AndroidCredentialsImpl.kt   # Core CredentialManager logic
│       │   └── AndroidCredentialsPackage.kt
│       ├── newarch/        # New Architecture module class
│       └── oldarch/        # Old Architecture module class (fallback)
├── example/                # Example app
└── lib/                    # Built output (generated, not committed)
```

## How to contribute

1. **Fork** the repository and create a feature branch.
2. Make your changes and add tests where applicable.
3. Run `npm run typecheck` and `npm run lint` to check for errors.
4. Open a **Pull Request** against `main` with a clear description.

## What we need most right now

- **Device testing**: Testing flows on a physical Android device (API 24/28/33+) and filing issues for any failures.
- **Passkeys**: End-to-end testing with a real WebAuthn backend.
- **Google Sign-In**: End-to-end testing with a real Google OAuth client ID.
- **Error handling**: Better error messages, edge case coverage.
- **iOS stub**: Graceful fallback (already stubbed, but could be improved).
- **Expo config plugin**: Automating Android manifest setup for Expo users.

## Reporting bugs

Please [open a GitHub issue](https://github.com/iconifybeyond/react-native-android-credentials/issues) with:
- Your environment (React Native version, Android API level, New Architecture enabled?)
- Steps to reproduce
- Expected vs actual behaviour
- Any relevant error messages or logs

## Code style

- TypeScript: strict, no `any` on the public surface.
- Kotlin: idiomatic, coroutines for async work.
- Prettier + ESLint for JS/TS formatting (run `npm run lint`).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
