# Ask-out-your-Valentine

Diese kleine Seite ist bereit für GitHub Pages.

## Deploy auf GitHub Pages (schnell)
1. Neues Repository auf GitHub anlegen (z. B. `ask-out-your-valentine`).
2. Lokal initialisieren und pushen:

```bash
cd Ask-out-your-Valentine-main
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<dein-username>/ask-out-your-valentine.git
git push -u origin main
```

3. Auf GitHub: Repository → Settings → Pages → Source: `main` branch / `/ (root)` wählen → Speichern.
4. Nach wenigen Minuten ist die Seite verfügbar unter `https://<dein-username>.github.io/ask-out-your-valentine/`.

## Hinweise
- Die Seite verwendet relative Pfade zu den Bildern, also stelle sicher, dass der `images/` Ordner im Repo enthalten ist.
- Der Konfetti-Code wird über ein UMD-Skript eingebunden, daher funktioniert die Seite statisch ohne Server-Anforderungen.
- Wenn du Hilfe beim Hochladen oder beim Einrichten von GitHub Pages brauchst, kann ich die Schritte gerne für dich durchgehen.

Viel Erfolg und viel Glück beim Valentinsgruß! ❤️
