# Product Definition: DeterminaPass

## Vision
DeterminaPass is a zero-knowledge, zero-database, deterministic password manager. Passwords are never stored anywhere—neither in cloud databases nor in local storage. Instead, passwords are mathematically derived in real-time using cryptographically secure hashing (SHA-256) from user inputs:
1. Service Name (Site/Domain)
2. Username / Email
3. Creation Date (or version date)
4. Mnemonic Password 1: Global Mnemonic (shared across all accounts)
5. Mnemonic Password 2: Service Mnemonic (unique per service)
6. Security Level (Low: 12 chars alnum, Medium: 16 chars alnum+symbols, High: 24 chars, Ultra: 32 chars + double hash)

## Cross-Platform Ecosystem
- **Web App:** Angular Single Page Application hosted on GitHub Pages (`https://racoci.github.io/password-manager/`).
- **Mobile App:** Kotlin Multiplatform (KMP) + Compose Multiplatform application for Android and iOS.
- **Interoperability:** Plain-text unencrypted `services.yaml` files storing only public non-sensitive metadata (site, user, update date, security level).
