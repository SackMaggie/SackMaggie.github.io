# ataphon.exe — Personal Portfolio

> **Live site:** https://SackMaggie.github.io

Helldivers 2–themed personal portfolio for **Ataphon Srilakham**, Senior Software Engineer & Solution Architect at 2C2P.

---

## Stack

Pure static site — no framework, no build step.

| File | Purpose |
|---|---|
| `index.html` | Single-page layout, all sections |
| `style.css` | Helldivers 2 dark-military theme (CSS variables, responsive) |
| `script.js` | GitHub contribution graph, Steam status, easter egg |
| `stratagem.js` | Stratagem Hero mini-game |
| `assets/` | Local sounds (MP3) + stratagem icons (SVG) from [StratagemHeroOnline](https://github.com/CombustibleToast/StratagemHeroOnline) |

## Stratagem Mini-Game

Click **CALL FOR SUPPORT** (bottom-right) to open the terminal.  
Use **Arrow keys** or **WASD** to input stratagem sequences.

- Wrong key → skips to next stratagem (timer keeps running)
- Timer hits zero → Game Over, press any key to restart
- Complete the Eagle 500KG Bomb sequence (`↑ → ↓ ↓ ↓`) to unlock **Hard Mode**
- Unit tests: open `/stratagem.test.html`

## Easter Egg

The Konami-style code `↑ → ↓ ↓ ↓` (Eagle 500KG Bomb) triggers a hidden panel.

## Local Dev

```bash
npx serve -p 3000 .
# open http://localhost:3000
```

## Deploy

GitHub Pages — push to `main`, site updates in ~1 minute.

---

*Assets from [CombustibleToast/StratagemHeroOnline](https://github.com/CombustibleToast/StratagemHeroOnline) — fan project, not affiliated with Arrowhead Game Studios.*
