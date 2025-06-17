# Development Guidelines

This repository tracks the progress of a multi-phase password manager project. The
`README.md` lists all phases and their status.

* Keep `README.md` updated when a phase is completed.
* Run `npm install` once before running tests if `node_modules` is missing.
* Execute `npm test -- --watch=false` inside `password-manager-app` after code
  changes. Tests may fail if Chrome is unavailable.

## Current Progress
* Phase 1 – Configurable database: **done**
* Phase 2 – Security level selection in the UI: **done**
* Phases 3+ – Not implemented yet
