# Password Manager App

This project is a small Angular application that generates deterministic passwords based on the selected site, user name and master password. The application stores a list of generated passwords in memory and supports exporting or importing this configuration using AES encryption.

## Usage

```bash
npm install
npm start
```

The app will be available at `http://localhost:4200`.

### Build

```bash
npm run build
```

### Tests

```bash
npm test
```
Chrome or Chromium is required to run the Karma tests.

## Features

- Deterministic password generation using SHA-256.
- Encrypted export and import of stored records.
- Simple UI built with Angular Material.

## Limitations

Passwords are kept only in memory and there is no backend. Use at your own risk.
