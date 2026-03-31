# Oído Armónico — Tracker del Proyecto

> Referencia interna para documentar módulos, decisiones, ideas y avance.
> Actualizar cuando se agrega o cambia algo relevante.

---

## Estado general

**Deploy:** Firebase Hosting via GitHub Actions  
**Stack:** HTML + CSS + JS puro (sin frameworks), Web Audio API  
**Repo:** `/Users/pipe_oz/Documents/entrenador-auditivo`  
**Notion:** https://www.notion.so/31e81bd61cb281c29e7fcd04efb648cf

---

## Módulos implementados

### Tab ① Aprender
- Tarjetas de teoría: inversiones (fundamental, 1ª inv., 2ª inv.)
- Visual con colores por tipo de inversión

### Tab ② Explorar
- Grid de 72 acordes filtrable por calidad y raíz
- Click para escuchar cada acorde

### Tab ③ Acordes (Practicar)
- **Inversiones** — Quiz 3 pasos: calidad → posición → intervalos
- **Solo posición** — Secuencia de N acordes, identifica inversión acorde a acorde
- Constructor de secuencias propias (guardadas en localStorage)

### Tab ④ Grados / Armonía
Seis modos de entrenamiento:

| Modo | Ejercicio | Implementado |
|------|-----------|:---:|
| Grados | Identifica grado (I–VI) con contexto Do Mayor | ✓ |
| Funciones | ¿Tónica / Subdominante / Dominante? | ✓ (mar-2026) |
| Cadencias | ¿Auténtica perfecta/imperfecta, plagal, rota, semi? | ✓ (mar-2026) |
| Tonal / Modal | ¿El movimiento resuelve (tonal) o flota (modal)? | ✓ (mar-2026) |
| Progresiones | Identifica acorde a acorde (13 progresiones + propias) | ✓ |
| Completar | ¿Qué acorde falta al final? | ✓ (mar-2026) |

### Tab ⑤ Dictado
- Dictado isócrono: 10 notas de un pentacordio (6 escalas)
- Velocidades: lento / normal / rápido
- Teclado en pantalla con retroalimentación visual

### Tab ⑥ Intervalos
- 10 intervalos diatónicos (2ª m a 8ª)
- Dirección: ascendente / descendente / simultáneo
- Selección activa de intervalos a practicar

---

## Sistema de progreso
- **localStorage** clave `oido_armonico_v1`
- **Firebase Firestore** — sincronización por usuario (auth con Google)
- Selección adaptativa por módulo: el sistema prioriza lo más débil
- Historial de últimas 10 rondas con trend arrow (↑ ↓ →)
- Rachas (streak ≥ 70%)
- Panel de análisis global (📊 en el header)

---

## Datos de teoría

### Grados (Do Mayor)
| Grado | Nombre | Calidad | Función | Color |
|-------|--------|---------|---------|-------|
| I | Tónica | Mayor | Tónica | #4caf7d |
| II | Supertónica | menor | Subdominante | #c4886e |
| III | Mediante | menor | Tónica | #9b8ec4 |
| IV | Subdominante | Mayor | Subdominante | #d4aa3e |
| V | Dominante | Mayor | Dominante | #e07a3a |
| VI | Superdominante | menor | Tónica | #6abfb0 |

### Cadencias (CADENCE_TYPES en app.js)
| ID | Nombre | Movimiento | Nota especial |
|----|--------|-----------|---------------|
| aut_perf | Auténtica Perfecta | V → I fund | Cierre más sólido |
| aut_imp | Auténtica Imperfecta | V → I⁶ | I en 1ª inversión (Mi en el bajo) |
| plagal | Plagal | IV → I | El "amén" |
| rota | Rota / Evitada | V → VI | Cadencia de engaño |
| semi | Semicadencia | I → V | Pregunta sin respuesta |

### Progresiones (PROGRESSIONS en app.js)
18 progresiones predefinidas + personalizadas del usuario.  
Categorías: 2 acordes (cadencias), 3 acordes, 4 acordes, circulares 3-5 acordes.

---

## Decisiones técnicas

- **Sin frameworks**: todo vanilla JS/CSS para máxima simplicidad de deploy
- **Web Audio API**: osciladores sine con compresor/limiter, no samples externos
- **Arpegio cíclico**: allegro → largo → vuelve a allegro (no infinito)
- **Firebase Auth**: `signInWithPopup` para todos los browsers (Safari incluido)
- **Safari AudioContext**: recovery automático en `visibilitychange`
- **Deploy**: Firebase Hosting via GitHub Actions (no GitHub Pages)
- **`playMidiSequence(midisArray, arpInterval)`**: función para tocar acordes con inversiones personalizadas (sin depender de DEGREES.midis)

---

## Ideas pendientes / Backlog

### Alta prioridad
- [ ] **PWA**: manifest.json + service worker para uso offline
- [ ] **Firebase AI Logic (Gemini)**: análisis personalizado de progreso, sugerencias de ejercicios

### Media prioridad
- [ ] **Menor armónica**: escala La menor armónico con E7 como dominante (permite cadencias auténticas con "sabor exótico")
- [ ] **Cadencias en otras tonalidades**: actualmente todo en Do Mayor — añadir Sol Mayor y Fa Mayor como opciones
- [ ] **Modo dictado armónico**: escuchar una progresión y escribir los grados en orden (no identificar acorde a acorde sino de memoria)
- [ ] **Referencia visual de cadencias**: tarjetas explicativas tipo "Aprender" para los 5 tipos de cadencia
- [ ] **Exportar progreso**: CSV o gráfico de curva de aprendizaje

### Baja prioridad
- [ ] **Más escalas en Dictado**: La menor, Re menor, modos (Dórico, Mixolidio)
- [ ] **Modo "práctica libre"**: escuchar y construir progresiones propias en tiempo real
- [ ] **VII grado**: añadir Si disminuido al banco de grados (función de dominante)
- [ ] **Cadencias modales**: implementar "cadencia por insistencia" y "cadencia lineal" modal

---

## Bugs conocidos / Notas

- El III (Mi menor) usa MIDIs en registro bajo [52,55,59] — sonar un poco oscuro es intencional pero puede causar confusión en el modo Funciones (comparte notas con I y V)
- El modo "Completar" muestra los acordes del prefijo como referencia visual — decisión pedagógica intencional (el usuario ya los escuchó, verlos conecta oído con teoría)
- En iOS Safari, el AudioContext puede suspenderse tras ~30s en segundo plano; hay recovery automático en `visibilitychange`

---

## Historial de cambios relevantes

| Fecha | Cambio |
|-------|--------|
| mar-2026 | Modos Funciones, Cadencias, Tonal/Modal, Completar en tab Grados |
| mar-2026 | Campo `funcion` en DEGREES, arrays CADENCE_TYPES y MODAL_PROGS |
| mar-2026 | `playMidiSequence()` para acordes en inversión |
| feb-2026 | iOS AudioContext recovery (`visibilitychange`) |
| feb-2026 | Layout iOS-style con bottom nav y header actions |
| feb-2026 | Deploy a Firebase Hosting via GitHub Actions |
| feb-2026 | Firebase Auth con `signInWithPopup` (todos los browsers) |
