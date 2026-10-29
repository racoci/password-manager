# Technology Stack

## Web Application (`password-manager-app/`)
- **Framework:** Angular 20 (Standalone Components)
- **Language:** TypeScript 5.8
- **Testing:** Jasmine + Karma (Headless Chrome)
- **Deployment:** GitHub Actions -> GitHub Pages

## Mobile Application (`password-manager-mobile/`)
- **Framework:** Kotlin Multiplatform (KMP) + Compose Multiplatform
- **Language:** Kotlin 2.1+
- **Targets:** Android (SDK 34+) & iOS (XCFramework / CocoaPods)
- **Architecture:** MVI / Clean Architecture (shared ViewModel, StateFlow, domain use cases)
- **Crypto:** Kotlin Multiplatform Cryptography (SHA-256 derivation symmetrically identical to TypeScript implementation)
- **Serialization / YAML:** Kotlinx Serialization / YAML parser
- **Testing:** kotlin.test + compose-multiplatform test harness
