# SPEC 01 — Cuatro fantasmas con comportamientos diferenciados

> **Status:** Approved
> **Depends on:** —
> **Date:** 2026-10-02
> **Objective:** Reemplazar los dos fantasmas actuales por cuatro (chaser, ambusher, flanker y shy) con comportamientos distintos que salen escalonadamente de la pen.

## Por qué existe este spec

Hoy solo hay dos fantasmas y un comportamiento binario: `hunter` (persigue en línea recta) y `random`. La lógica de decisión vive mezclada en `game.js`. Este spec la extrae a un módulo dedicado y la generaliza a cuatro comportamientos, sin recurrir a pathfinding real.

## Scope

**In:**

- Cuatro fantasmas con `kind` propio: `chaser`, `ambusher`, `flanker`, `shy`.
- Cuatro posiciones iniciales dentro de la pen.
- Salida escalonada por retardo en frames (`releaseDelay`).
- Objetivo de salida `(13,11)` mientras el fantasma sigue dentro de la pen.
- Nuevo módulo `src/js/ghosts.js` con la decisión de dirección.
- Misma velocidad (`GHOST_SPEED`) para los cuatro.
- Empates de dirección resueltos al azar.
- Los fantasmas se bloquean entre sí (no se solapan).
- Un color estable por tipo.

**Out of scope (para specs futuros):**

- Power pellets, modo asustado y comer fantasmas.
- Ciclos chase/scatter por tiempo.
- Velocidades distintas por fantasma.
- Niveles, frutas, puntuación extra y sonido.
- Persistencia entre sesiones.
- Pathfinding real (A*/BFS).

## Data model

```js
// maze.js
const GHOST_STARTS = [
  { x: 13, y: 14, kind: 'chaser',   releaseDelay: 0   },
  { x: 14, y: 14, kind: 'ambusher', releaseDelay: 120 },
  { x: 12, y: 14, kind: 'flanker',  releaseDelay: 240 },
  { x: 15, y: 14, kind: 'shy',      releaseDelay: 360 },
];

const PEN_EXIT = { x: 13, y: 11 };
```

```js
// game.js — cada fantasma devuelto por createGame()
{
  x, y,
  dir: 'up',
  speed: GHOST_SPEED,
  kind,          // 'chaser' | 'ambusher' | 'flanker' | 'shy'
  releaseDelay,  // copiado de GHOST_STARTS
  releaseTimer: 0,
  released: false,
}
```

Convenciones:

- Coordenadas celda `(x, y)`, origen arriba-izquierda.
- `releaseDelay` en frames a 60fps: 0 / 2 / 4 / 6 s.
- Distancia usada por todos los comportamientos: Manhattan (no pathfinding).

## Comportamientos

- **Salida** (`releaseTimer < releaseDelay`): el fantasma no se mueve.
- **En pen** (liberado y `y >= 12`): objetivo `PEN_EXIT` `(13,11)`.
- **Fuera** (`y <= 11`): comportamiento propio.
  - `chaser`: objetivo = celda actual de Pac-Man.
  - `ambusher`: objetivo = celda de Pac-Man + 2 veces su dirección.
  - `flanker`: objetivo = espejo de Pac-Man respecto al chaser: `(2*chaser.x - pacman.x, 2*chaser.y - pacman.y)`.
  - `shy`: si distancia > 8 persigue a Pac-Man; si `<= 8` se detiene en su celda.
- **Común:** se descartan la dirección inversa, las paredes/puerta y las celdas ocupadas por otro fantasma. Si no queda opción, se permite invertir. Empate de distancia → elección aleatoria.

## Implementation plan

1. `maze.js`: ampliar `GHOST_STARTS` a 4 entradas con `kind` y `releaseDelay`, y añadir `PEN_EXIT`. Test manual: se ven 4 fantasmas (aún con la lógica actual).
2. Crear `src/js/ghosts.js` con `window.decideGhost(game, g)`, helpers de celda objetivo, liberación y salida; implementar `chaser` y un fallback aleatorio. Exponer `window.canMove` y `window.OPPOSITE` en `game.js`, hacer que `moveGhost` use `window.decideGhost`, y cargar `ghosts.js` entre `game.js` y `render.js`. Test: el chaser sale de la pen y persigue; los otros la abandonan.
3. Implementar `ambusher` (2 celdas delante) con empate aleatorio. Test: tiende a cortar el paso.
4. Implementar `flanker` (espejo respecto al chaser). Test: su trayectoria depende de la posición del chaser.
5. Implementar `shy` (persigue a más de 8 celdas, se detiene a 8 o menos). Test: se frena al acercarse.
6. Añadir colisión fantasma-fantasma filtrando celdas ocupadas, con permiso de inversión para desbloquear. Test: no se solapan.
7. `render.js`: reordenar `GHOST_COLORS` a `['#ff0000','#ffb8ff','#00ffff','#ffb852']` para que coincida con el orden de `kind`. Test: rojo, rosa, cian y naranja.

## Acceptance criteria

- [ ] La partida arranca con exactamente 4 fantasmas.
- [ ] Los 4 empiezan en la pen y ninguno se mueve antes de su `releaseDelay`.
- [ ] Chaser sale a ~0 s, ambusher ~2 s, flanker ~4 s, shy ~6 s.
- [ ] El chaser reduce la distancia Manhattan a Pac-Man en cada decisión.
- [ ] El ambusher apunta a 2 celdas delante de Pac-Man.
- [ ] El flanker apunta al espejo de Pac-Man respecto al chaser.
- [ ] El shy persigue a >8 celdas y se queda inmóvil a <=8.
- [ ] Dos fantasmas nunca ocupan la misma celda.
- [ ] Ante empates de distancia la dirección elegida varía entre ejecuciones.
- [ ] Los 4 fantasmas tienen color distinto y estable por tipo.
- [ ] Al perder una vida los 4 vuelven a su celda inicial y repiten la salida escalonada.
- [ ] Ganar/perder y el movimiento de Pac-Man (paredes, puerta, túnel) siguen funcionando.
- [ ] No hay errores en la consola durante una partida completa.

## Decisions

- **Sí:** 4 comportamientos clásicos simplificados (`chaser`, `ambusher`, `flanker`, `shy`).
- **Sí:** los 4 arrancan dentro de la pen; salida por retardo en frames (0/120/240/360).
- **Sí:** salida con objetivo fijo `(13,11)`, alcanzable desde cualquier columna interior.
- **Sí:** misma velocidad para todos. Evita que el chaser haga la partida injugable.
- **Sí:** nombres por comportamiento, coherentes con `hunter`/`random` actuales.
- **Sí:** lógica en `src/js/ghosts.js`; `game.js` expone `canMove`/`OPPOSITE` por `window`.
- **Sí:** ambusher a 2 celdas (no 4), para acotar dificultad.
- **Sí:** flanker como espejo y shy que se detiene de cerca (versión simplificada elegida).
- **Sí:** empates al azar; los fantasmas sí colisionan entre sí.
- **No:** velocidades distintas por fantasma.
- **No:** ciclos chase/scatter.
- **No:** power pellets / modo asustado.
- **No:** pathfinding real (A*/BFS); basta heurística Manhattan.

## Risks

| Risk | Mitigation |
| --- | --- |
| Bloqueo mutuo de fantasmas | Si no hay vecino libre, permitir invertir la dirección. |
| La colisión entre fantasmas los frena demasiado | Revisar tras el paso 6; si es injugable, permitir solape parcial. |
| `shy` detenido tapa un pasillo | Es el comportamiento pedido; se ajusta si molesta al jugar. |
| Retardos en frames dependen de 60fps | Los valores son orientativos; se validan visualmente. |

## What is **not** in this spec

- Power pellets / modo asustado / comer fantasmas.
- Ciclos chase/scatter.
- Velocidades distintas por fantasma.
- Niveles, frutas, puntuación extra, sonido y persistencia.
- Pathfinding real.

Cada uno de esos puntos, si llega, va en su propio spec.
