# Prueba de la Fase 3 en las pantallas de la demo (Bloque C)

Qué hacer con el pulgar en el Nubia, **en vertical y en horizontal**, y qué deberías sentir. El Bloque B (el componente, en la página de prueba) tiene su propia guía: `prueba-bloque-b.md`; esta es la prueba **en las pantallas de verdad** (mapa, Ajustes, negocio). Para levantar la demo o abrir la publicada, ver `specs/fase-1/estado.md`.

---

## 0. Estado

| Tarea | Commit | Qué |
|---|---|---|
| T3-10 | `2be2a17` | Zonas reales de RUTEANDO en el mapa; "Mover ancla" en Ajustes; la posición se guarda por orientación |
| T3-11 | `2bc1a32` | Recorrido solo deslizando de la Fase 3 (sin un toque) |
| T3-12 | este | Esta guía y el estado |

Pruebas: **616** del núcleo, **58** de la demo y **403** E2E, todas en verde. Las 12 tareas de la Fase 3 están hechas.

**Límite:** Playwright solo cambia el tamaño de la ventana; **el giro real y el teclado en horizontal** solo los confirma tu celular.

---

## 1. El mapa y sus esquinas (zonas de RUTEANDO)

1. Abre el **Mapa**. Vas a ver, como en RUTEANDO:
   - abajo a la derecha, el crédito **"© OpenStreetMap"** (pequeño, en gris);
   - abajo a la izquierda, el logo **"Ruteando"**;
   - arriba a la izquierda, los botones **+ / −** (en la demo son solo de adorno: el zoom es el del ancla y el de doble toque).
2. Abre el abanico. **Deberías ver:** ni el ancla, ni las opciones, ni la banda tapan el crédito.
3. **Gira a horizontal** y repite. Lo mismo: el crédito siempre a la vista.
4. En **Ajustes → Mano: Izquierda**, vuelve al mapa: el ancla está a la izquierda y tampoco tapa el logo.

## 2. Mover el ancla desde Ajustes

1. **Ajustes.** Arriba está **"Dónde está el ancla"**, con el botón **"Mover el ancla"**.
2. **Solo deslizando:** abre el abanico, desliza a **"Mover ancla"** (cuatro flechas) y **quédate quieto** un momento: el ancla se engancha a tu pulgar. Llévala **abajo del todo** y suéltala.
   - **Deberías ver:** queda abajo, sobre el margen.
3. Ve al **Mapa**.
   - **Deberías ver:** el ancla quedó **un poco más arriba**, para no tapar el crédito de OpenStreetMap.
4. Vuelve a **Ajustes**: el ancla está **otra vez abajo del todo**. (En el mapa se corre, pero no se olvida de dónde la dejaste.)
5. **Recarga la página**: sigue donde la dejaste.

## 3. Cambiar de mano

1. En Ajustes, toca **"Mover el ancla"** (el ancla late), **tócala y arrástrala al otro costado**. Suéltala.
   - **Deberías ver:** el ancla del otro lado, el abanico abierto hacia el centro, y el selector **Mano** de Ajustes cambiado.
2. **Pregunta clave (H13):** si usas las dos manos según el momento, ¿esto es **fácil e intuitivo**? Si no, se agrega "Cambiar de mano" en el abanico (DF3-03).

## 4. Una posición por orientación

1. En vertical, deja el ancla **alta**. Gira a horizontal y déjala **baja**.
2. Gira varias veces.
   - **Deberías ver:** cada orientación vuelve a **su** posición.
3. En horizontal, el control de **altura** de Ajustes dice **"Altura en horizontal"** y mueve solo la horizontal.

## 5. Bienvenida (si quieres verla otra vez)

- **Ajustes → "Repetir la bienvenida"**: primero pregunta **con qué mano** (desliza el asa hacia ese lado), después la demostración de siempre.

---

## 6. Qué contarme
1. ¿El crédito del mapa **se ve siempre**, también en horizontal y con el ancla abajo?
2. **Mover el ancla desde Ajustes**: ¿se encuentra? ¿Quedarse quieto sobre "Mover ancla" se entiende?
3. **Cambiar de mano arrastrando**: ¿alcanza, o hace falta "Cambiar de mano" en el abanico?
4. ¿La posición por orientación se siente natural al girar?
5. ¿Algo tapado que no debería (logo, botones +/−, textos)?
