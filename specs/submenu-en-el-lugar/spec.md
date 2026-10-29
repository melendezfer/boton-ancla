# Submenú en el lugar (v0.7.0)

**Origen:** recorrido 24 de RUTEANDO, N24-31 (Jose, 2026-10-29): "«Más» y «Zoom» despliegan sus opciones ahí mismo
(Perfil, Favoritos / Acercar, Alejar) sin volver a tocar el botón principal: ahorra dos toques. Aplica a todo
submenú del ancla." Aprobado para construir en este repositorio, con spec y pruebas, el 2026-10-29.

## Hoy
Elegir "Más" (una acción cuya `onSelect` abre una capa, HM-08) deja el ancla en reposo con la capa abierta: para ver
sus opciones hay que soltar, volver a tocar el ancla y abrir el abanico (dos toques de más).

## Requisitos

- **SL-01** `AnchorAction` acepta `abreSubmenu?: boolean`. Lo declara quien usa la biblioteca en las acciones cuya
  `onSelect` abre una capa con opciones propias ("Más", "Zoom"). Las acciones que abren una hoja o una búsqueda
  (por ejemplo "Buscar") no lo llevan: no conviene tapar su contenido con el abanico.
- **SL-02** Al ejecutarse una acción con `abreSubmenu`, en cuanto la capa queda registrada (la vista del ancla
  cambia a la de la capa), el abanico se abre **solo**, en **modo toque** (C-06), con las opciones de la capa y
  "Cerrar" a 90° (HM-03). El usuario elige con un toque o deslizando desde el ancla, como en cualquier modo toque.
- **SL-03** Si la capa no aparece en **1 s** (la app no la abrió), no pasa nada: el ancla queda en reposo.
- **SL-04** Se cierra igual que el modo toque de siempre: tocar fuera, tocar el centro, Escape o `T_INACTIVO` sin
  actividad (no es el modo del lector de pantalla, que no se cierra por tiempo).
- **SL-05** Si cuando aparece la capa el ancla no está en reposo (el usuario ya volvió a tocarla), no se fuerza nada.
- **SL-06** Métrica: la apertura cuenta como `open` (modo toque) con `via: "submenu"`, para medir cuántos toques ahorra.
- **SL-07** Núcleo puro: el evento nuevo `ABRIR_SUBMENU { t, geo }` lleva de `reposo` a `abierto_toque`; en
  cualquier otro estado no hace nada. El temporizador de 1 s y la detección de la capa viven en el adaptador.

## Relación con otras decisiones
- Tamaño de las opciones: decidido en `specs/area-de-toque/` (v0.7.1).

## Fuera de alcance
Submenús anidados más de un nivel (una capa dentro de un submenú abre su abanico solo si su acción también lleva
`abreSubmenu`; no hay otra regla).

## Pruebas
- Núcleo: `ABRIR_SUBMENU` abre en modo toque desde reposo, con cierre por inactividad; no cambia nada en otro estado.
- E2E de la demo: elegir "Más" deja abierto el abanico de la capa sin tocar el ancla; elegir una opción de la
  capa la ejecuta; sin capa en 1 s, reposo; "Buscar" (sin `abreSubmenu`) no abre el abanico.
