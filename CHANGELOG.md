# Changelog

Alle relevanten Änderungen an diesem Projekt werden hier dokumentiert.

Das Format orientiert sich an "Keep a Changelog" und SemVer.

## [Unreleased]

### Added
- Externe Asset-Struktur mit [assets/mia-optimized.css](assets/mia-optimized.css), [assets/mia-optimized.js](assets/mia-optimized.js) und [assets/mia-logic.mjs](assets/mia-logic.mjs).
- Observability-Modul [assets/mia-observability.mjs](assets/mia-observability.mjs) für zentrale Fehler-/Telemetry- und Debug-Panel-Logik.
- Unit-Tests für pure Logik in [tests/mia-logic.test.mjs](tests/mia-logic.test.mjs).
- End-to-End-Tests mit Playwright in [tests/e2e/mia.spec.mjs](tests/e2e/mia.spec.mjs) plus Konfiguration in [playwright.config.mjs](playwright.config.mjs).
- End-to-End-Tests erweitert (Keyboard-Shortcuts und Secret-Overlay-Flow).
- PWA-Icons unter [images/icons/](images/icons/) und Manifest-Einbindung.
- Service-Worker-Debugseite [sw-debug.html](sw-debug.html) (nur lokal bzw. mit `?debug=1`).
- Husky + lint-staged Pre-Commit-Checks.

### Changed
- CSP gehärtet in [mia-optimized.html](mia-optimized.html) (keine Inline-Skripte/-Styles notwendig).
- Interaktionslogik modularisiert und testbare Hilfsfunktionen extrahiert.
- "Vielleicht"-Antworten erweitert und ohne direkte Wiederholung randomisiert.
- Accessibility verbessert (Fokusfalle im Modal, Fokus-Rückgabe, dynamische ARIA-Updates).
- CI-Workflow in [.github/workflows/quality.yml](.github/workflows/quality.yml) auf reproduzierbare npm-basierte Checks umgestellt.
- E2E-CI verbessert: Playwright-Artefakte werden bei Testfehlern automatisch als Artifact hochgeladen.
- Service-Worker-Strategie in [sw.js](sw.js) für neue Assets und Caching-Regeln aktualisiert.

### Security
- Tooling-Abhängigkeiten aktualisiert, Audit-Befund auf 0 reduziert.
- Security-Header-Policy via CSP präzisiert.
