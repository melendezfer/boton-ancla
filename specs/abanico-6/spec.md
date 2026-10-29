# Abanico de 6 opciones (v0.6.0)

**Origen:** recorrido 23 de RUTEANDO (Jose, 2026-10-28). En el mapa faltaba "Avisos" sin quitar "Zoom":
"6 opciones, sin quitar Zoom… en reposo ~44 px de diámetro (nunca menos, para no fallar el toque); al pasar el
pulgar por encima, crece a ~56 px con una transición suave. Abre un poco más el radio del arco para que quepan
sin encimarse. Regla para toda la app: máximo 6 opciones por abanico; lo demás va en «Más». Respeta «Reducir
movimiento» del sistema."

## Requisitos

- **AB-01** `MAX_OPCIONES` pasa de 5 a **6**, contando "Atrás". `validateScreen` sigue rechazando más.
- **AB-02** Cada opción mide `D_OPCION` = **44 px** en reposo por defecto. **Decisión final (Jose, 2026-10-29,
  v0.7.1):** el tamaño visible puede ser menor (RUTEANDO dibuja 36 px), porque el mínimo táctil lo garantiza
  aparte el área de toque invisible `D_TOQUE` (≥ 44 px, 48 por defecto) — ver `specs/area-de-toque/`.
- **AB-03** La preseleccionada (bajo el pulgar) crece a **56 px**: `ESCALA_PRESEL` = 1.27 (≈56 px).
- **AB-04** El crecimiento es una transición suave de **140 ms**; con `prefers-reduced-motion: reduce` el cambio
  es inmediato (RNF-04 ya lo exige para las animaciones de movimiento).
- **AB-05** El radio adaptativo deja **6 px** entre vecinas (`SEPARACION_MIN`): con 6 opciones en el arco de 90°
  ninguna se enciama, ni siquiera con la preseleccionada a 56 px (la cuerda entre vecinas ≥ (56 + 44)/2).
- **AB-06** El techo del ancla (`ANCLA_ALTURA`, HM-01) y la banda de etiqueta (HM-02) se calculan con el abanico
  de 6 a tamaño crecido, como ya hacían con el de 5.
- **AB-07** "Más": la biblioteca no agrupa opciones; quien la usa (RUTEANDO) manda como máximo 6 y pone lo demás
  en una opción "Más" que abre una capa.

## Fuera de alcance
Cambiar el arco (90°–180°), la histéresis o los gestos.
