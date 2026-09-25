# Botón-ancla — Tareas Fase 1

Cada tarea es pequeña, termina en **un commit** y no empieza hasta que la anterior esté verde.
Formato: **Cubre** (IDs de `spec.md`) · **Hacer** · **Prueba automática** · **Prueba manual** (cuando hay UI) · **Commit**.
"Bloqueada por C-xx" = necesita tu decisión sobre ese punto (hoy no hay ninguna bloqueada; todo está decidido en `design.md` §0).

Estados: `[ ]` pendiente · `[~]` en curso · `[x]` hecha.

---

## Bloque A — Núcleo (`packages/core`, solo Vitest, sin navegador)

### [x] T-01 · Esqueleto del monorepo
- **Cubre:** D-18, RNF-07 (estructura)
- **Hacer:** `package.json` raíz con workspaces `packages/*` y `apps/*`; `tsconfig.base.json` estricto; `packages/core` con `tsconfig` **sin `DOM` en `lib`**, Vitest en entorno `node`; scripts raíz `test`, `typecheck`.
- **Prueba:** `npm install`, `npm run typecheck` y `npm test` pasan (una prueba de humo `1+1`). Prueba de que un archivo con `window` **no** compila en core.
- **Commit:** `chore: monorepo con npm workspaces y paquete core`

### [x] T-02 · Tipos, parámetros y validación de pantallas
- **Cubre:** §6 (v0.2), §7, C-11, C-13, `MAX_OPCIONES`
- **Hacer:** `types.ts`, `params.ts` (`DEFAULT_PARAMS` con los valores de §6), `validateScreen`.
- **Prueba (Vitest):** `DEFAULT_PARAMS` coincide con §6; `validateScreen` rechaza más de 5 contando "Atrás", ids repetidos y reversible sin `onUndo`; acepta las 4 pantallas de §8.
- **Commit:** `feat: tipos, parámetros y validación de pantallas del núcleo`

### [x] T-03 · Geometría y posición del abanico
- **Cubre:** D-03, D-17, RF-12, HU-11 (espejo), §6 `ARCO`/`MARGEN_LATERAL`/`MARGEN_INFERIOR`/radio adaptativo · C-01 y L-02 decididos
- **Hacer:** `geometry.ts` (ángulo, distancia, espejo), `computeAnchorPosition`, `computeFanLayout` → `FanLayout` con radio adaptativo, sectores y `fueraDePantalla` (`design.md` §4.2–§4.3).
- **Prueba (Vitest):** para viewports de 320, 375, 412 y 430 px de ancho × mano derecha/izquierda × 1–5 opciones × áreas seguras (0 y 34 px abajo): ninguna opción escalada queda fuera (`fueraDePantalla = false`) y en un viewport diminuto sí se marca; ángulos entre 90° y 180° (o su espejo); sin solape entre opciones a tamaño normal (radio 113 px con 5, 100 px con ≤4) y el radio crece al subir `SEPARACION_MIN`; la mano izquierda es el espejo exacto de la derecha; sectores contiguos de 70° a 200°; ancla a 56 px del borde lateral y 48 px del inferior (más el área segura).
- **Commit:** `feat: posición del ancla y cálculo del abanico`

### [x] T-04 · Asignación de acciones por prioridad
- **Cubre:** §6 "Distribución" y `DESEMPATE`, D-10 ("Atrás" fijo), RF-08 ("Deshacer" en prioridad 1) · C-10, C-11, C-21 decididos
- **Hacer:** `orderActions` (con la opción `deshacer`), `assignActions` (`design.md` §4.4).
- **Prueba (Vitest):** "Atrás" siempre en 90°; prioridad 1 en el slot más cercano a 135° con 1–5 opciones; empate hacia la horizontal por defecto y hacia arriba con `DESEMPATE = "vertical"`; acciones sin prioridad al final en orden de declaración; los 4 ejemplos de `design.md` §4.4 (incluido "Deshacer" reemplazando a Editar sin mover nada); espejo con la mano izquierda; error si no coinciden acciones y slots.
- **Commit:** `feat: asignación de acciones a posiciones del abanico`

### [x] T-05 · Selección por ángulo
- **Cubre:** RF-02, RF-03, RF-04, RF-05, RF-07 (anillo) · C-08
- **Hacer:** `resolveSelection`.
- **Prueba (Vitest):** dentro de `R_MUERTA` → sin id (aunque haya `previous`); cada sector devuelve su id; en el borde, con `previous`, no cambia hasta superar 8°; los extremos aceptan hasta 20° fuera del arco; fuera de 70°–200° → sin id; `beyondOuter` justo antes y después de `R_EXTERIOR`; todo igual en espejo para la mano izquierda.
- **Commit:** `feat: resolución de la preselección por ángulo y distancia`

### [x] T-06 · Máquina: reposo, armado, descanso y gesto
- **Cubre:** §3 filas 1, 4–19, 34, 37 · D-07, D-08, D-10, D-11, HU-01, HU-02, HU-03, HU-04, HU-06 (lógica) · C-05, C-07
- **Hacer:** `states.ts`, `transition.ts` (estos estados), `deadline.ts`.
- **Prueba (Vitest):** una prueba por fila de la tabla, pasando `t` a mano (sin temporizadores falsos): toque vs. movimiento vs. descanso en los bordes exactos de 10 px, 250 ms y 400 ms; deslizamiento rápido sin MOVE (C-05); deriva en descanso (C-07); `experto` verdadero/falso alrededor de `T_ANIM`; `transition` nunca lanza error ante eventos inesperados.
- **Commit:** `feat: máquina de estados para gesto y descanso`

### [x] T-07 · Máquina: acciones irreversibles
- **Cubre:** D-14, RF-07, HU-08 (lógica), §3 filas 12, 17–19
- **Prueba (Vitest):** soltar sobre irreversible sin cruzar → `bloqueado_sensible`; cruzar → `confirmacion_armada`; volver dentro o cambiar de sector → `abierto_gesto`; soltar confirmado → `ejecutando`.
- **Commit:** `feat: confirmación deslizando más allá para irreversibles`

### [x] T-08 · Máquina: modo toque
- **Cubre:** D-07, D-13, HU-05, RF-11 (lógica), §3 filas 20–30 · C-06 decidido
- **Prueba (Vitest):** tocar opción normal → ejecuta; irreversible → `confirmacion_toque` → `CONFIRMAR` ejecuta; tocar centro/fuera → cancela; 4 s sin actividad → cancela y cualquier actividad reinicia la cuenta; presionar el centro y deslizar → `abierto_gesto`.
- **Commit:** `feat: modo toque en la máquina de estados`

### [x] T-09 · Máquina: cancelaciones globales, teclado y activación
- **Cubre:** RF-09, RF-10, RNF-05 (lógica), §3 filas 2, 3, 31–33, 35, 36 · C-12 decidido
- **Prueba (Vitest):** desde cada estado activo, segundo `pointerId`, `POINTER_CANCEL`, `ORIENTACION` y `CAMBIO_SECCION` → `cancelado` con su motivo; en reposo se ignoran; navegación con flechas, Home/End, Enter, Escape; `abierto_teclado` no tiene plazo.
- **Commit:** `feat: cancelaciones del entorno y navegación por teclado`

### [x] T-10 · `createAnchorMachine` y métricas derivadas
- **Cubre:** §7, §9, RNF-08 · C-04
- **Hacer:** envoltorio `send/subscribe/nextDeadline`; `derivarMetricas(prev, next, evento)`.
- **Prueba (Vitest):** los suscriptores reciben `prev/next/evento`; cada cambio de la tabla de `design.md` §3.5 produce su evento exacto; un recorrido completo (abrir, cambiar dos veces, ejecutar) produce `open`, `preselect`×2, `execute` con `ms` y `pathPx` correctos.
- **Commit:** `feat: envoltorio de la máquina y métricas derivadas`

### [x] T-11 · Bienvenida (lógica)
- **Cubre:** HU-12 (lógica), `USOS_ETIQUETA` · C-17
- **Hacer:** `welcome.ts`: `registrarUso`, `mostrarEtiqueta`, `necesitaDemostracion`, `marcarDemostracion` como funciones puras, y `serializarBienvenida` / `leerBienvenida` para que el adaptador guarde el texto en `localStorage` (el núcleo no conoce ningún almacenamiento). Los conteos van por id de acción.
- **Prueba (Vitest):** la etiqueta se muestra en los usos 1–5 y no en el 6; los conteos son por opción; la demostración solo la primera vez.
- **Commit:** `feat: lógica de bienvenida y etiquetas de primeros usos`

---

## Bloque B — Demo y herramientas de prueba

### [x] T-12 · App demo vacía en el puerto 3002
- **Cubre:** §0 (demo), L-09, L-12
- **Hacer:** `apps/demo` con Next 16.3.4, React 19.2.8, TS 5, Tailwind v4 (`@import "tailwindcss"` + tokens de RUTEANDO en `:root` + `@theme inline`), `@phosphor-icons/react`; `viewport` con `viewportFit: "cover"`; `next.config.ts` con `transpilePackages`, `devIndicators: false` y `allowedDevOrigins`; script `dev` = `next dev -H 0.0.0.0 -p 3002`; `scripts/lan-3002.sh`, que detecta la IP actual de WSL y la del Wi-Fi, revisa el `portproxy` del 3002 y, si falta o apunta a una IP vieja, **genera** el `.ps1` con los comandos de administrador (portproxy + firewall) y te dice cómo ejecutarlo. No lo ejecuta ni toca RUTEANDO.
- **Prueba:** `npm run build -w demo` compila.
- **Manual:** abrir `http://<IP>:3002` en PC **y** en el celular (aquí se resuelve la red de WSL, L-09).
- **Commit:** `chore: app demo con Next.js y Tailwind en el puerto 3002`

### [x] T-13 · Pantallas simuladas sin ancla
- **Cubre:** §8, RNF-09, D-06 · C-14, C-15, C-16 decididos (incluye `MinusCircle` y `ArrowCounterClockwise` en el registro)
- **Hacer:** `semantic-icons.ts` de la demo, `demo-store.tsx`, mapa falso arrastrable con 3 fondos, rutas de `design.md` §8, hojas inferiores `z-[1000]`, barra superior con Ajustes y Métricas.
- **Prueba:** `npm run build`; prueba unitaria de que ningún ícono aparece dos veces en el registro.
- **Manual:** navegar todas las pantallas en PC y celular; el mapa se arrastra con un dedo.
- **Commit:** `feat: pantallas simuladas de RUTEANDO en la demo`

### [x] T-14 · Playwright con emulación táctil
> Verificada el 24-09-2026 después de instalar las librerías del sistema: 25 pruebas pasan y 1 se salta a propósito (control deslizante en WebKit, L-07).
- **Cubre:** §10.2 (infraestructura), L-07, L-14
- **Hacer:** `playwright.config.ts` con proyectos `Pixel 7` (Chromium) y `iPhone 14` (WebKit), `webServer` en 3002; `e2e/helpers/gestos.ts` (CDP en Chromium, `PointerEvent` sintéticos en WebKit); instalación de navegadores (tú ejecutas el `sudo`).
- **Prueba:** test de humo: arrastrar el mapa falso con el helper mueve el lienzo en ambos proyectos.
- **Commit:** `test: configuración de Playwright con gestos táctiles`

---

## Bloque C — Adaptador React (`packages/react`) conectado a la demo

A partir de aquí, cada tarea se prueba sobre la pantalla **Mapa** de la demo; las demás se conectan en T-24.

### [x] T-15 · Provider y ancla en reposo
- **Cubre:** D-04, D-09, D-17, D-19, RF-12, RF-14, RNF-05 (nombre), RNF-06 · C-02 decidido
- **Hacer:** `AnchorProvider`, `useAnchorScreen` (cambio por `screen.id`), portal, `anchor.css` con `--ba-*`, sonda de área segura, botón translúcido con ícono de sección.
- **E2E:** el botón tiene nombre "Menú, sección Mapa", `aria-haspopup="menu"`, `aria-expanded="false"`; queda dentro del viewport en ambos dispositivos; está por encima de una hoja `z-[1000]` abierta.
- **Manual:** legibilidad del ancla sobre mapa claro, foto y oscuro (§10.3).
- **Commit:** `feat: proveedor React y ancla en reposo`

### [x] T-16 · Gesto completo: abrir, preseleccionar, ejecutar, cancelar
- **Cubre:** RF-01…RF-06, RNF-02, RNF-03, D-08, D-09, D-10, HU-01, HU-02, HU-03, HU-06, HU-13 · L-01, L-04, L-05
- **Hacer:** eventos de puntero con captura, abanico con opciones y escala, banda de etiqueta (HM-02), centro que anticipa el ícono, vibración, `onSelect` sincrónico.
- **E2E:** HU-01 (Buscar abre el campo enfocado; reposo en < 200 ms), HU-02 (cambia la preselección y el ícono del centro sin soltar), HU-03 (volver al centro no ejecuta), HU-06 (deslizamiento de ~60 ms ejecuta), HU-13 (deslizar desde el ancla no mueve el mapa; arrastrar el mapa pasando por el ancla no lo abre).
- **Manual:** una mano en el celular; sin lupa ni selección en iOS; modo experto sin mirar.
- **Commit:** `feat: gesto de abrir, preseleccionar y ejecutar`

### [x] T-17 · Descanso visible
- **Cubre:** D-11, D-12, HU-04
- **E2E (`page.clock`):** 400 ms quieto → anillo de descanso sin opciones; soltar no ejecuta; deslizar desde el descanso abre en modo gesto.
- **Manual:** leer sosteniendo el celular con el pulgar sobre el ancla.
- **Commit:** `feat: modo descanso del ancla`

### [x] T-18 · Modo toque
- **Cubre:** D-07, D-13, HU-05, RF-11 · L-06
- **Hacer:** abrir con toque, overlay que captura toques fuera (y el clic fantasma), cierre a los 4 s.
- **E2E:** toque abre; tocar una opción ejecuta; tocar fuera cierra **y el contenido no recibe el clic**; 4 s sin actividad cierra.
- **Commit:** `feat: modo toque con cierre por inactividad`

### [x] T-19 · Acciones sensibles
- **Cubre:** D-14, RF-07, RF-08, HU-07, HU-08, RNF-01 · C-03, C-19 y C-21 decididos (el aviso sigue aunque cambie la sección)
- **Hacer:** anillo exterior, aviso "Desliza más allá para confirmar", aviso con deshacer (5 s, `role="status"`), "Confirmar" en modo toque, "Deshacer" en la posición de prioridad 1 del abanico mientras dura el aviso (C-03).
- **E2E:** HU-07 (se aplica al instante, aviso 5 s; deshacer deslizando hasta la posición de prioridad 1 **y** tocando el aviso revierte y registra `undo`), HU-08 (soltar sobre Eliminar no elimina; más allá sí), confirmación en modo toque.
- **Commit:** `feat: deshacer y confirmación de acciones sensibles`

### [x] T-20 · Cancelaciones del entorno y teclado virtual
- **Cubre:** RF-09, RF-10, RF-13 · L-03, L-04, L-11
- **E2E:** segundo dedo cancela (Chromium con CDP multitoque); cambio de orientación cancela; navegar a otra sección cancela y cambia el ícono; con el campo de búsqueda enfocado el ancla se oculta.
- **Manual:** abrir el teclado en Android e iPhone; gesto "atrás" y barra de inicio cerca del ancla.
- **Commit:** `feat: cancelación por entorno y ocultar con teclado abierto`

### [x] T-21 · Accesibilidad: teclado y movimiento reducido
- **Cubre:** RNF-04, RNF-05 · C-12, L-13
- **E2E:** Tab al ancla, Enter abre, flechas mueven el foco (`aria-expanded`, `role="menuitem"`), Enter ejecuta, Escape cierra y devuelve el foco; con `emulateMedia({ reducedMotion: "reduce" })` no hay transformaciones animadas.
- **Manual:** VoiceOver (iPhone) o TalkBack (Android): el ancla se anuncia y se usa con doble toque.
- **Commit:** `feat: navegación por teclado y movimiento reducido`

### [x] T-22 · Mano izquierda
- **Cubre:** HU-11, D-12, D-17
- **E2E:** en Ajustes elegir "Mano izquierda" → ancla abajo a la izquierda, abanico reflejado; el mismo gesto espejado ejecuta la misma acción.
- **Manual:** probar con la mano izquierda.
- **Commit:** `feat: preferencia de mano izquierda`

### [x] T-23 · Bienvenida
- **Cubre:** HU-12 · C-17
- **E2E:** con almacenamiento limpio, la demostración ocurre una vez; durante los primeros 5 usos la banda muestra "Desliza hacia una opción" sin preselección y el nombre de la opción con preselección (HM-02); con 5 usos en todas las opciones, el nombre de la sección; "Repetir la bienvenida" en Ajustes la repite.
- **Commit:** `feat: bienvenida con demostración y etiquetas`

---

## Bloque D — Integración, métricas y cierre

### [x] T-24 · Ancla en todas las pantallas de §8
- **Cubre:** D-06, HU-10, §8 · C-14, C-15 decididos
- **E2E:** HU-10 (Carta desde el perfil cambia el ícono a Carta; Compartir no lo cambia); cada pantalla muestra exactamente sus acciones.
- **Manual:** ejecutar las 4–5 opciones de cada pantalla con una sola mano.
- **Commit:** `feat: ancla integrada en todas las pantallas de la demo`

### [ ] T-25 · Registro y exportación de métricas
- **Cubre:** §9, RNF-08 · C-04, C-20, L-10
- **Hacer:** `onEvent` → almacenamiento local; pantalla Métricas con lista, formulario (versión, dispositivo, mano, posición, nº de opciones, observaciones) y exportar JSON por descarga.
- **E2E:** un recorrido genera los eventos esperados; el JSON exportado tiene los campos de §9; no hay peticiones de red con métricas.
- **Commit:** `feat: registro local y exportación de métricas`

### [ ] T-26 · E2E "solo deslizando" y matriz completa
- **Cubre:** D-15, RNF-01, HU-09, §10.2 (HU-01…HU-13)
- **Hacer:** test que recorre **todas** las acciones de **todas** las pantallas usando solo arrastres (el helper falla si se usa `tap`), incluida la confirmación de Eliminar y el deshacer.
- **Prueba:** toda la suite E2E pasa en Pixel 7 e iPhone 14; tabla HU → archivo de prueba en `e2e/README.md`.
- **Commit:** `test: recorrido completo solo deslizando`

### [ ] T-27 · Prueba manual, contraste y rendimiento
- **Cubre:** §10.3, RNF-03, RNF-06, criterio de salida · L-02, L-05, L-08
- **Hacer:** `specs/fase-1/pruebas-manuales.md` con la lista de §10.3 y tabla de resultados (dispositivo, navegador, persona, fecha, observaciones); medición de contraste sobre los 3 fondos; perfil de rendimiento con CPU ×4–×6.
- **Manual:** la lista completa en PC, Android e iPhone; 3 personas, una usando solo deslizamiento.
- **Commit:** `docs: resultados de pruebas manuales de la fase 1`

### [ ] T-28 · README
- **Hacer:** cómo instalar, correr la demo en 3002, abrirla desde el celular, correr Vitest y Playwright, y dónde está cada documento.
- **Commit:** `docs: README con instrucciones de desarrollo y pruebas`

---

## Trazabilidad rápida (HU → tareas)

| HU | Lógica (Vitest) | UI + E2E |
|---|---|---|
| HU-01 | T-06 | T-16 |
| HU-02 | T-05, T-06 | T-16 |
| HU-03 | T-06 | T-16 |
| HU-04 | T-06 | T-17 |
| HU-05 | T-08 | T-18 |
| HU-06 | T-06 | T-16 |
| HU-07 | T-10 | T-19 |
| HU-08 | T-07 | T-19 |
| HU-09 | T-08 (fila 25) | T-26 |
| HU-10 | T-09 | T-24 |
| HU-11 | T-03, T-05 | T-22 |
| HU-12 | T-11 | T-23 |
| HU-13 | — | T-16 |
