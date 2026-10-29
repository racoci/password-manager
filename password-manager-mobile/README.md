# DeterminaPass Mobile (Kotlin Multiplatform)

This is the Kotlin Multiplatform (KMP) client for **DeterminaPass**, supporting both **Android** and **iOS** with **Compose Multiplatform**.

## Features
- **100% Shared UI & Business Logic:** Single shared Compose codebase across Android and iOS.
- **Dual Mnemonic Passwords:**
  1. Global Mnemonic Password (shared master password across all services)
  2. Service Mnemonic Password (individual mnemonic password per service)
- **Zero-Storage / Zero-Knowledge:** Passwords are derived in real-time and never saved anywhere.
- **YAML Interoperability:** Import and export `services.yaml` public metadata seamlessly between the web app and mobile app.
- **Symmetrical Deterministic Crypto:** Uses the exact SHA-256 byte-level derivation algorithm matching the Angular Web application.

## Project Structure
- `composeApp/src/commonMain/kotlin/com/determina/pass/domain/`: Pure Kotlin SHA-256 derivation engine and YAML parser.
- `composeApp/src/commonMain/kotlin/com/determina/pass/ui/`: Compose Multiplatform shared UI and state.
- `composeApp/src/commonTest/`: Automated unit tests verifying lengths, character pools, and symmetrical YAML processing.

## Running the App
- **Android:** Open `password-manager-mobile` in Android Studio and run `composeApp` on an emulator or device.
- **iOS:** Open the generated Xcode project in `iosApp` (or run `./gradlew iosDeploy` on macOS).
