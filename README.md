# Drei Werkzeuge, ein Bauprinzip

Landingpage zu drei Unterrichtsprojekten von Stephan Wilski (Gesamtschule Meiderich):

- **Einfaches digitales Arbeitsblatt** – Papier-Look, Live-Dashboard, Hilfe auf Knopfdruck (Skill `/einfaches-ab`)
- **Papiertheater** – Erklärfilme im Bilderbuch-Stil (Skill `/papiertheater-bauen`)
- **Popup-Buch** – das große Ägypten-Popup-Buch (Skill `/popupbook`), unter `/buch/` direkt eingebunden

Statische Seite, keine Cookies, keine externen Anfragen. Schriften (Bricolage Grotesque, Atkinson Hyperlegible Next, beide SIL OFL) liegen in `site/assets/fonts/`.

## Struktur

```
site/index.html        die Seite (CSS und JS eingebettet)
site/impressum.html    Impressum und Datenschutz – Platzhalter [..] vor dem Livegang ausfüllen!
site/assets/img/       Screenshots (WebP)
site/assets/js/        GSAP 3.15 (ScrollTrigger, SplitText, DrawSVG; Standardlizenz, kostenlos), Lenis 1.3 (MIT), seite.js (Bewegung)
site/buch/index.html   das Ägypten-Popup-Buch (Build aus WIlski54/Aegypten, dist/index.html)
Dockerfile, nginx.conf Auslieferung über nginx
```

## Lokal ansehen

```bash
cd site && python -m http.server 8080   # http://localhost:8080
```

## Deployment mit Coolify

1. In Coolify: neue Ressource → Public/Private Repository → `WIlski54/projektvorstellung`, Branch `main`.
2. Build Pack: **Dockerfile**. Ports Exposes: **80**.
3. Domain eintragen, z. B. `https://projekte.wilski.tech` (Cloudflare-Wildcard ist vorhanden).
4. Deploy. Prüfen: `https://projekte.wilski.tech/health` liefert `ok`.

## Später austauschen

- AB- und Papiertheater-Bilder in `site/assets/img/` (`ab-*.webp`, `pt-*.webp`) gegen die Demoprojekte tauschen.
- Im Papiertheater-Abschnitt den Hinweis „Der Demofilm folgt“ ersetzen bzw. den Film einbinden.
- Neues Popup-Buch: `dist/index.html` nach `site/buch/index.html` kopieren.

## Bewegung

- Auf Bildschirmen ab 1000 px Breite: weiches Scrollen (Lenis), Blätterstapel mit gerissener Papierkante, Leporello entfaltet sich, Arbeitsblatt als Scroll-Geschichte, Vorhang als Übergang ins Papiertheater, Querfahrt durch die Buch-Stationen.
- Schmale Bildschirme und „Bewegung reduzieren“: ruhige, statische Fassung mit allen Inhalten (Reiter, Pfeile, Abspiel-Knopf).
- Alles in `site/assets/js/seite.js`; Bibliotheken liegen lokal, keine externen Anfragen.
