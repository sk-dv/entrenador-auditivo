# Changelog

Cambios relevantes del repo. La dirección y backlog viven en el [spec de Notion](https://app.notion.com/p/Entrenador-Auditivo-31e81bd61cb281c29e7fcd04efb648cf); este archivo es el único registro del histórico de código.

## jun-2026

- **Motor de audio → superdough.** Reemplazado el sine + envelope manual por `superdough@1.3.0` (ESM/CDN, vía esm.sh) conservando las firmas públicas (`playNote`, `playChord`, `playMidiSequence`, `stopAllNodes`, `setMasterVolume`). Nuevo `js/audio-engine.js` (type=module) expone `window.__engine`; `js/audio.js` queda como capa fina que delega. Topología: superdough → comp → masterGain → lim → destination. `playDegreeContext` refactor a `playNote` (sin osciladores huérfanos). Recovery iOS via `__engine.resume()`. Unlock al primer clic ya lo cubre `initAudioOnFirstClick`. `sw.js` v5.
- **Consolidación de dirección** en Notion. Sección "Dirección | Spec funcional": norte de audición funcional, plan por fases 0→5, decisiones tomadas. Ruta nativa → Capacitor (post-PWA), referencias = anclas de función. "Sumar no quitar" degradado a barandilla de ingeniería.

## may-2026

- **Pase editorial.** `css/editorial.css` (hairlines + aire), cuerpo → Inter. Íconos PWA 192/512/apple-touch. `sw.js` v4.
- **Reestructura modular.** Monolitos → `js/` (15), `css/` (6), `partials/` (9). `index.html` 1301 → 137 líneas. Bootstrap con fetch + `initApp()`. `sw.js` v3.
- Tipografía: IBM Plex Mono + Playfair → Fraunces + Nunito Sans (vars CSS).
- Fix: panel adaptativo de intervalos (⑥) leía `INT_POOL` inexistente → `ALL_INTERVALS`.
- Modo progresivo, tabla de funciones, subfunción + movimiento natural en ④.

## abr-2026

- Paso 3 del quiz de inversiones: identificación de raíz con hints adaptativos (`detalle.raiz`).
- PWA: manifest + service worker (cache-first). Panel adaptativo por intervalo en ⑥. Re-sync cross-device en `visibilitychange`.
- Sync bidireccional de custom progs/seqs a Firestore + botón ↑ sync.
- Explicaciones intervalo→color en quiz (`int1Why`, `int2Why`, `rev-insight`, `cc-insight`).

## mar-2026

- Modos Funciones, Cadencias, Tonal/Modal, Completar en ④.
- `playMidiSequence()` para acordes en inversión.

## feb-2026

- iOS AudioContext recovery (`visibilitychange`).
- Layout iOS-style: bottom nav + header actions.
- Deploy a Firebase Hosting via GitHub Actions.
- Firebase Auth con `signInWithPopup`.
