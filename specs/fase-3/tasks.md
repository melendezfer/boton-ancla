# Botón-ancla — Tareas Fase 3

Cada tarea es pequeña, termina en **un commit** y no empieza hasta que la anterior esté verde (todas las pruebas, tipos y lint).
Formato: **Cubre** (IDs de `spec.md`) · **Hacer** · **Prueba automática** · **Prueba manual** (cuando hay UI) · **Commit**.
No hay tareas bloqueadas: todo está decidido (`spec.md` §1b, `design.md` §0).

Estados: `[ ]` pendiente · `[~]` en curso · `[x]` hecha.

---

## Bloque A — Núcleo (`packages/core`, solo Vitest)

### [x] T3-01 · Tipos, parámetros y compatibilidad
- **Cubre:** RF3-06, RF3-08, DF3-05, H13 · `design.md` §2
- **Hacer:** `Orientacion`, `Lado`, `Colocacion`, `PrefsAncla`, `Zona`; `MARGEN_ZONA` y `ANCLA_ALTURA_H` en `DEFAULT_PARAMS` y en la tabla de parámetros de la spec de la Fase 1; `colocacionDesdePrefs({ hand })` para la compatibilidad.
- **Prueba:** los parámetros coinciden con la spec; `{ hand: "left" }` equivale a `{ vertical: { lado: "left", altura: 0.44 } }`; sin horizontal se usa el lado de vertical y 0,30.
- **Commit:** `feat(core): tipos de colocación, orientación y zonas (Fase 3)`

### [x] T3-02 · Huella del ancla y posiciones válidas
- **Cubre:** RF3-02, RF3-03, RF3-10, RF3-13, H11, DF3-02, DF3-06 · `design.md` §4.1–§4.3
- **Hacer:** `huellaAncla(colocacion, entorno)` (ancla + abanico más grande + banda + avisos); `posicionesValidas(entorno, zonas, prioridades)` → intervalos por lado.
- **Prueba:** sin zonas, un intervalo por lado igual al rango piso–techo de la Fase 1; una zona recorta el intervalo por arriba, por abajo o lo parte en dos; `MARGEN_ZONA` se respeta; las preferidas se ignoran al pedir solo obligatorias; mano izquierda = espejo; con áreas seguras y teclado.
- **Commit:** `feat(core): huella del ancla y posiciones válidas con zonas`

### [x] T3-03 · Imán y resolver la colocación
- **Cubre:** RF3-03, RF3-05, RF3-12, RF3-13, RF3-15, DF3-03, DF3-04 · `design.md` §4.3–§4.4
- **Hacer:** `imanColocacion(punto, validas)`; `resolverColocacion(guardada, entorno, zonas)` con sus 5 pasos.
- **Prueba:** soltar cerca de cada costado elige ese lado (y cambia la mano); altura llevada al intervalo más cercano; la guardada inválida se ajusta sin borrarse y vuelve cuando la zona desaparece; conflicto con preferidas; horizontal con teclado sin lugar arriba → `abreHacia: "abajo"`; sin lugar en ninguna → `sin_lugar`.
- **Commit:** `feat(core): imán y resolución de la colocación del ancla`

### [x] T3-04 · Abanico hacia abajo y joystick espejado
- **Cubre:** RF3-15, P-05 · `design.md` §3 (`abreHacia`)
- **Hacer:** `computeFanLayout` con `direccion`; selección con el arco espejado; `haciaDesplazamiento` usa 30°–150° cuando el abanico abre hacia abajo.
- **Prueba:** con `abajo`, las opciones quedan bajo el ancla con el mismo orden de prioridades (espejo vertical); la selección y el anillo exterior funcionan; el joystick entra hacia arriba y ya no hacia abajo; con `arriba` nada cambia (todas las pruebas de la Fase 1 siguen verdes).
- **Commit:** `feat(core): abanico hacia abajo cuando no cabe arriba (P-05)`

### [x] T3-05 · Estado `editando` y métricas
- **Cubre:** RF3-01, RF3-04, D-12, HU3-01, HU3-04, §9 · `design.md` §3 filas 54–58
- **Hacer:** `AnchorAction.moveAnchor`; filas 54–58; evento `EDITAR`; transitorio `soltado`; métricas `anchor_move`, `anchor_move_cancel`, `hand_change`, `orientation`, `zone_conflict`.
- **Prueba:** quedarse quieto sobre "Mover ancla" entra a `editando`; soltar sin esperar ejecuta `onSelect`; descanso, joystick, experto y relámpago **no** entran; segundo dedo, orientación, sección y Escape cancelan; `EDITAR` desde reposo; métricas de cada caso.
- **Commit:** `feat(core): modo edición del ancla en la máquina de estados`

## Bloque B — Adaptador React (`packages/react`)

### [x] T3-06 · Colocación por orientación en el proveedor
- **Cubre:** RF3-06…RF3-09 · `design.md` §4.5, §5.1
- **Hacer:** `useOrientacion`; props `placement` / `onPlacementChange` (con `prefs.hand` como compatibilidad); el ancla usa `resolverColocacion`; al girar, cancelar y recolocar sin animación.
- **Prueba (E2E):** en vertical y en horizontal (`setViewportSize`) el ancla está abajo del lado guardado; al girar ida y vuelta, cada orientación recupera la suya; la primera vez en horizontal copia el lado a 30 %.
- **Prueba manual:** girar el Nubia con la demo abierta.
- **Commit:** `feat(react): colocación del ancla por orientación`

### [x] T3-07 · Zonas reservadas
- **Cubre:** RF3-10…RF3-13, H11, DF3-06 · `design.md` §5.2
- **Hacer:** `useAnchorReservedArea` (ResizeObserver, recálculo en reposo, aviso en consola si hay conflicto); la banda y los avisos usan la colocación resuelta.
- **Prueba (E2E):** una zona obligatoria nunca queda bajo el ancla, el abanico abierto, la banda ni un aviso; una zona que crece durante una interacción recoloca el ancla al volver a reposo; al quitar la zona, el ancla vuelve a su posición guardada.
- **Commit:** `feat(react): zonas reservadas que el ancla no tapa`

### [x] T3-08 · Modo edición: arrastrar, bandas válidas e imán
- **Cubre:** RF3-01…RF3-05, RF3-16, HU3-01…HU3-06, DF3-01…DF3-03 · `design.md` §5.3
- **Hacer:** dibujo del modo edición (bandas, silueta, línea de inicio con clic), velo, imán al soltar con `T_CENTRADO`, `useAnchorMove()`.
- **Prueba (E2E, solo deslizando):** entrar desde la opción, arrastrar, soltar lejos de todo y ver el imán; soltar en el otro costado cambia la mano y el abanico se refleja; cancelar con segundo dedo; el botón de Ajustes funciona tocando.
- **Commit:** `feat(react): mover el ancla arrastrándola`

### [x] T3-09 · Bienvenida: ¿con qué mano?
- **Cubre:** RF3-14, HU3-13, H13, DF3-08 · `design.md` §5.4
- **Hacer:** paso de la mano en la bienvenida (deslizar o botones), `manoPreguntada`, "Repetir la bienvenida".
- **Prueba (E2E):** con almacenamiento limpio, deslizar a la izquierda deja el ancla a la izquierda; los botones también; la segunda vez no se pregunta.
- **Commit:** `feat(react): la bienvenida pregunta la mano`

## Bloque C — Demo e integración

### [x] T3-10 · Zonas de RUTEANDO y Ajustes en la demo
- **Cubre:** `spec.md` §8, DF3-01, DF3-09 · `design.md` §6
- **Hacer:** crédito OSM (obligatoria), logo y botones de zoom (preferidas) en el mapa; opción y botón "Mover ancla" en Ajustes; preferencias por orientación con migración; el control deslizante ajusta la orientación actual.
- **Prueba (E2E):** con la mano derecha y la izquierda, en vertical y horizontal, el crédito nunca queda tapado (ni con el abanico abierto); migrar `mano` + `anclaAltura` guardados de antes.
- **Commit:** `feat(demo): zonas reales de RUTEANDO y mover el ancla desde Ajustes`

### [x] T3-11 · Recorrido completo solo deslizando y regresión
- **Cubre:** D-15, HU3-01…HU3-13
- **Hacer:** agregar al recorrido de `t26-solo-deslizando` mover el ancla y cambiar de mano; revisar que todas las E2E de la Fase 1 siguen verdes en vertical.
- **Commit:** `test: recorrido solo deslizando de la Fase 3`

### [x] T3-12 · Guía de prueba manual y estado
- **Cubre:** `spec.md` §10.3
- **Hacer:** `prueba-fase3.md` (qué hacer con el pulgar en el Nubia, vertical y horizontal, y qué contar); actualizar `estado.md`.
- **Commit:** `docs: guía de prueba de la Fase 3`

---

## Trazabilidad rápida (HU → tareas)

| HU | Tareas |
|---|---|
| HU3-01 entrar a mover | T3-05, T3-08 |
| HU3-02 arrastrar | T3-08 |
| HU3-03 soltar con imán | T3-03, T3-08 |
| HU3-04 arrepentirse | T3-05, T3-08 |
| HU3-05 cambio rápido de mano | T3-03, T3-08 |
| HU3-06 la mano se recuerda | T3-06 |
| HU3-07 horizontal abajo | T3-04, T3-06 |
| HU3-08 una posición por orientación | T3-01, T3-06 |
| HU3-09 girar en medio de algo | T3-05, T3-06 |
| HU3-10 zona reservada | T3-02, T3-07, T3-10 |
| HU3-11 las zonas cambian | T3-07 |
| HU3-12 no hay lugar | T3-03, T3-07 |
| HU3-13 bienvenida pregunta la mano | T3-09 |
