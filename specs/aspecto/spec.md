# Botón-ancla — Especificación: aspecto en reposo (v0.4)

Versión 0.2 · 10-10-2026 (RA-09: gesto para guardarla) · antes 0.1 del 09-10-2026 · Pedido por el usuario tras probar RUTEANDO en el celular
(spec de RUTEANDO `docs/specs/ajustes-e1-e4.md` §F, aprobada). Continúa la Fase 1 y la
Fase 3: lo que no cambia aquí sigue igual.

## 1. Problema

En RUTEANDO el ancla deja una **columna vertical** vacía a la derecha (la app le reserva
una franja para que no tape nada) y en reposo se ve como un disco opaco y borroso que no
deja ver lo que hay debajo. La persona quiere un botón **redondo, semitransparente**,
que invite a tocarlo sin estorbar.

## 2. Requisitos

| ID | Requisito |
|---|---|
| RA-01 | **Sin rectángulo ni columna**: el ancla es solo un círculo. La biblioteca no pide reservar una franja (la app puede dejar de reservarla, §4). |
| RA-02 | **Semitransparente en reposo**: deja ver lo que hay debajo (fondo `OPACIDAD_REPOSO` 0.45 y desenfoque `DESENFOQUE_REPOSO` de 2 px, antes 0.6 y 12 px). El ícono sigue a contraste pleno (C-02). |
| RA-03 | **Latido en reposo**: un brillo sutil cada `T_LATIDO` que invita a tocarla. Con `prefers-reduced-motion` no hay latido (RNF-04). Solo `transform` y `opacity` (RNF-03). |
| RA-04 | **Encendida tras usarla**: al tocarla o sacarla deslizando se enciende y muestra sus opciones (como hoy); al volver a reposo **se queda encendida** `T_ENCENDIDA` (3 s). |
| RA-05 | **Translúcida y luego recogida**: pasado `T_ENCENDIDA` vuelve a translúcida; tras otros `T_RECOGER` (15 s) sin usarla **se recoge al borde** de su lado: queda medio escondida (su centro sobre el borde) y el gesto sigue funcionando desde la mitad visible (el abanico se abre desde su lugar de siempre). Al tocarla vuelve a su sitio. |
| RA-06 | **Solo su círculo**: un toque o un deslizamiento que empieza fuera del círculo visible (aunque caiga en la caja del botón) no la activa. |
| RA-07 | Se mantiene lo que ya funciona: abanico con sexta opción, tocar un lado o el otro, deslizar y soltar, descanso, edición (Fase 3). |
| RA-08 | La app puede apagar el recogido (`RECOGER: false`), por ejemplo en una pantalla donde el borde ya está ocupado. |
| RA-09 | **Gesto para guardarla** (v0.5): el mismo de sacarla, al revés. Un deslizamiento rápido que empieza en el ancla y va hacia el borde de su lado (al menos `D_GUARDAR`, más horizontal que vertical y en menos de `T_GUARDAR`) la recoge al borde de inmediato, sin abrir ni ejecutar nada. Para sacarla: tocarla o deslizar desde la mitad visible hacia adentro (RA-05). |

## 3. Fuera de alcance

Aprender cuándo recogerse (Fase 5) y cambiar el ícono o el color del ancla.

## 4. Integración con RUTEANDO

RUTEANDO deja de reservar la franja (`.reserva-columna`) mientras el ancla está encendida:
el ancla flota sobre el contenido (spec de RUTEANDO §A.1 y §F).
