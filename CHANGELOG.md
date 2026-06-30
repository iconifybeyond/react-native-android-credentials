# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Unreleased

### Added
- Initial library scaffold with React Native New Architecture (Turbo Module + codegen)
- TypeScript public API:
  - `createPasswordCredential(username, password)` — save password credentials
  - `savePasskey(requestJson)` — register a passkey (WebAuthn create)
  - `getCredential(options)` — unified bottom-sheet: passwords + passkeys + Google
  - `signInWithGoogle(options)` — dedicated Google Sign-In flow
  - `clearCredentialState()` — clear credential state on sign-out
- Discriminated union `CredentialResult` with `CredentialType` enum
- `CredentialError` class with typed error codes: `USER_CANCELED`, `NO_CREDENTIAL`, `INTERRUPTED`, `UNSUPPORTED`, `UNKNOWN`
- Graceful iOS / non-Android degradation (rejects with `UNSUPPORTED` instead of crashing)
- Kotlin Android implementation using Jetpack Credential Manager:
  - New Architecture (Turbo Module) path (`src/newarch/`)
  - Old Architecture fallback path (`src/oldarch/`)
  - Coroutine-based async, exceptions mapped to typed JS error codes
- Example app demonstrating all five flows
- GitHub Actions CI workflow (typecheck + lint + build)
- MIT License (© iconifybeyond)
- README with setup guide, API reference, and roadmap
- CONTRIBUTING.md
