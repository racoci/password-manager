# Specification: DeterminaPass Mobile (Kotlin Multiplatform)

## 1. Overview
DeterminaPass Mobile is a cross-platform mobile client for Android and iOS built with **Kotlin Multiplatform (KMP)** and **Compose Multiplatform**. It allows users to deterministically generate passwords on mobile devices using the exact same mathematical model as the web application, with complete interoperability for importing and exporting public `services.yaml` files.

## 2. Functional Requirements
1. **Inputs:**
   - Site / Domain (e.g., `github.com`)
   - Username / Email (e.g., `user@domain.com`)
   - Global Mnemonic Password (shared master mnemonic)
   - Service Mnemonic Password (service-specific mnemonic)
   - Creation Date (ISO 8601 YYYY-MM-DD)
   - Security Level (`Low`: 12 chars alnum, `Medium`: 16 chars alnum+symbols, `High`: 24 chars, `Ultra`: 32 chars double-hashed)
2. **Real-time Reactive Generation:**
   - Recalculates generated password immediately upon change of any input field when all required parameters are provided.
3. **Copy to Clipboard:**
   - One-tap clipboard copy with visual notification.
4. **Local Service Management:**
   - Save favorite service entries (containing site, user, created, and security level).
   - Search/filter services.
   - Tap to fill input fields.
   - Delete saved services.
5. **YAML Interoperability:**
   - Export public metadata to `services.yaml`.
   - Import public metadata from `services.yaml` via OS File Picker.

## 3. Symmetrical Cryptography Specification
The seed string format MUST be:
`${site}|${user}|${created}|${globalMaster}|${serviceMaster}|${level}`
- Processed via SHA-256 (double SHA-256 for `Ultra`).
- XOR mapping byte array to characters pool according to security level rules:
  - Low: length 12, chars `A-Za-z0-9`
  - Medium: length 16, chars `A-Za-z0-9!@#$%^*`
  - High: length 24, chars `A-Za-z0-9!@#$%^*()_+-=[]{}|;:,.<>`
  - Ultra: length 32, chars `A-Za-z0-9!@#$%^*()_+-=[]{}|;:,.<>?/`~`
  - Byte mapping: `(bytes[i % bytes.length] ^ bytes[(i + 3) % bytes.length]) % chars.length`.

## 4. Acceptance Criteria
- Cross-validation: Password generated in KMP app MUST match Angular web app output character-for-character for identical input vectors.
- Automated tests pass on JVM / Android test runner.
- Builds successfully for Android and iOS targets.
