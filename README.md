## Mia Pages

Kleine statische Web-App (HTML/CSS/JS) mit Interaktionen, Animationen und Offline-Unterstützung via Service Worker.

Changelog: [CHANGELOG.md](CHANGELOG.md)

### Relevante Dateien

- [mia-optimized.html](mia-optimized.html): Hauptseite (Markup + CSP + Asset-Referenzen)
- [assets/mia-optimized.css](assets/mia-optimized.css): ausgelagerte Styles
- [assets/mia-optimized.js](assets/mia-optimized.js): ausgelagerte App-Logik
- [assets/mia-logic.mjs](assets/mia-logic.mjs): geteilte, pure Hilfslogik (für App + Tests)
- [assets/mia-observability.mjs](assets/mia-observability.mjs): Telemetrie-, Debug-Panel- und Error-Handler-Modul
- [tests/mia-logic.test.mjs](tests/mia-logic.test.mjs): Node-Testsuite für pure Logik
- [tests/e2e/helpers.mjs](tests/e2e/helpers.mjs): geteilte E2E-Test-Helfer (Navigation/State-Helpers)
- [tests/e2e/mia.spec.mjs](tests/e2e/mia.spec.mjs): Playwright End-to-End Tests
- [tests/e2e/mia.visual.spec.mjs](tests/e2e/mia.visual.spec.mjs): Playwright Visual-Regressionstests (Desktop + Mobile)
- [playwright.config.mjs](playwright.config.mjs): Playwright-Konfiguration
- [sw.js](sw.js): Caching/Offline-Strategie
- [manifest.webmanifest](manifest.webmanifest): PWA-Metadaten
- [images/](images/): GIF-Assets

### Lokale Befehle

Voraussetzung: Node.js 20+

- Abhängigkeiten installieren: `npm ci`
- HTML linten (Dateien als Argumente möglich): `npm run lint:html -- mia-optimized.html`
- Service Worker Syntax prüfen: `npm run check:sw`
- Unit-Tests ausführen: `npm run test:unit` (oder `npm test`)
- E2E-Tests (nur funktional, ohne @visual/@a11y) ausführen: `npm run test:e2e`
- Accessibility-Checks (axe) ausführen: `npm run test:a11y`
- Visual-Regressionstests ausführen: `npm run test:visual`
- Visual-Snapshots neu erzeugen: `npm run test:visual:update`
- Chromium für E2E installieren: `npm run e2e:install`
- Lokalen Server für Audits: `python3 -m http.server 4173`

### Entwicklungsnotizen

- Debug-Ausgaben sind über `CONFIG.DEBUG` in [assets/mia-optimized.js](assets/mia-optimized.js) steuerbar.
- Lokale Fehler-Telemetrie ist opt-in über `CONFIG.ENABLE_ERROR_TELEMETRY` in [assets/mia-optimized.js](assets/mia-optimized.js).
- Bei `CONFIG.DEBUG = true` laufen leichte Regression-Checks automatisch und sind auch über `window.__miaDebug.runRegressionChecks()` erreichbar.
- Bei `CONFIG.DEBUG = true` erscheint zusätzlich ein kleines Panel zum Kopieren/Leeren der Telemetrie.
- Service-Worker-Updates fragen den Nutzer und laden danach neu.
- Das Secret-Modal hat Fokus-Rückgabe und Fokusfalle (A11y).
- `Vielleicht`-Texte werden zufällig ohne direkte Wiederholung ausgespielt.
- Eine Content Security Policy ist im Head der Hauptseite gesetzt (ohne `unsafe-inline` für Scripts und Styles).

### Service-Worker Testseite

Für manuelle Update-/Cache-Tests gibt es [sw-debug.html](sw-debug.html).
Die Seite ist nur auf `localhost` oder mit Query-Parameter `?debug=1` aktiv.

### Deployment

Deployment läuft über GitHub Pages Workflow in [.github/workflows/pages.yml](.github/workflows/pages.yml).
Zusätzlich läuft ein Qualitäts-Workflow inkl. Lighthouse-Gates (Performance/A11y/Best-Practices/SEO) in [.github/workflows/quality.yml](.github/workflows/quality.yml).
Bei fehlschlagenden E2E-/Visual-Tests werden Playwright-Artefakte als CI-Artifact hochgeladen.
In Pull Requests wird zusätzlich ein `visual-diff-preview`-Artifact mit `actual`/`diff`-Bildern und Snapshot-Baselines hochgeladen.

Abhängigkeitsupdates (npm + GitHub Actions) laufen automatisiert über [.github/dependabot.yml](.github/dependabot.yml).









