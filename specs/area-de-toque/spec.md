# Área de toque invisible (v0.7.1) · decisión final

**Origen:** recorrido 24 de RUTEANDO. N24-30 pidió opciones más pequeñas y cerca del botón (RUTEANDO pasó
`D_OPCION: 36`, por debajo de los 44 px de AB-02). Decisión final de Jose (2026-10-29): "deja las opciones en 36 px
visibles, pero con área de toque invisible de al menos 44 px (ideal 48), sin que las áreas se encimen; si se
encimaran, abre un poco el radio". Reemplaza la nota anterior que dejaba la decisión para después.

## Requisitos

- **AT-01** Parámetro `D_TOQUE` (por defecto **48 px**): diámetro del área de toque invisible de cada opción. El
  área efectiva es `max(44, D_TOQUE, D_OPCION)`: nunca menos de 44 px (`TOQUE_MINIMO`), aunque se pida menos.
- **AT-02** Las áreas de toque de opciones vecinas **no se enciman**: el radio adaptativo usa como cuerda mínima
  `max(D_OPCION + SEPARACION_MIN, área de toque)`. Si hace falta, el arco se abre.
- **AT-03** En modo toque, un dedo que cae dentro del área de toque de una opción la elige, aunque quede fuera del
  círculo dibujado. Los gestos (deslizar) siguen eligiendo por ángulo (§3), sin cambio.
- **AT-04** Lo dibujado no cambia: `D_OPCION` visible, que crece con `ESCALA_PRESEL` bajo el pulgar.

## Con los valores de RUTEANDO
`D_OPCION` 36, `ESCALA_PRESEL` 1,5 (54 px bajo el pulgar), `SEPARACION_MIN` 4 y `D_TOQUE` 48: con 6 opciones el
arco queda en ~153 px del centro (antes de N24-30 eran ~160; con N24-30, ~128, pero las áreas de 54 px se
encimaban en modo toque).

## Pruebas
Núcleo: `test/area-toque.test.ts` (separación ≥ área de toque con 6 opciones, mínimo de 44 px, radio menor que el
de fábrica). Demo: un toque dentro del área pero fuera del círculo dibujado elige la opción.
