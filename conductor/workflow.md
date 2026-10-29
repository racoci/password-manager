# Project Workflow

## Guiding Principles
1. **The Plan is the Source of Truth:** All work must be tracked in `plan.md`.
2. **Symmetrical Cross-Validation:** Mathematical cryptographic outputs between Angular (TypeScript WebCrypto) and Kotlin Multiplatform must yield 100% identical outputs for identical seeds.
3. **Test-Driven Development (TDD):** Unit tests must be written and validated before finalizing implementations.
4. **Zero-Persistence Guarantee:** Never store passwords in unencrypted state or logs.

## Task Workflow
1. Select Task from `plan.md`.
2. Mark `[~]` in progress.
3. Write automated tests (Red phase).
4. Implement code to pass tests (Green phase).
5. Verify lint & build.
6. Commit & mark `[x]`.
