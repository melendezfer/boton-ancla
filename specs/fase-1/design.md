# Botón-ancla — Diseño Fase 1

Deriva de `spec.md` v0.1, que sigue siendo la fuente de verdad. Aquí se decide **cómo** se construye.

**Convención de este documento**
- `§n` = sección de `spec.md`. `HU/RF/RNF/D-xx` = IDs de `spec.md`.
- **C-xx** = contradicción o ambigüedad de la spec (lista en §9). Cuando el diseño necesita una respuesta para avanzar, pone una **Propuesta** marcada con su C-xx. Las propuestas **no se implementan hasta que las apruebes**; si las cambias, se actualizan aquí y en `tasks.md`.
- **L-xx** = límite de la plataforma web (sobre todo iOS Safari), lista en §10.
- Los puntos que se abran y necesiten explicación larga van a `decisiones-pendientes.md`.
- Toda decisión se registra **a la vez** en `spec.md` y en este documento.

---

## 0. Decisiones tomadas

Registro de lo que decidiste en la revisión. Lo que cambia la spec ya está en `spec.md` v0.2.

| ID | Decisión | Dónde se refleja |
|---|---|---|
| C-01 | Radio adaptativo según el número de opciones (113 px con 5), ajustable con parámetros para la prueba manual: `R_ARCO` (mínimo, 100) y `SEPARACION_MIN` (0). | spec §6; aquí §2, §4.3 |
| C-02 | Ícono oscuro (`text`) en reposo; `terracota` (`accent`) solo cuando el ancla está activa. | spec D-04; aquí §6 |
| C-03 | Mientras el aviso de deshacer está visible, "Deshacer" ocupa la posición de prioridad 1 del abanico (se hace solo deslizando). Tocar el aviso también deshace. | spec D-14, RF-08, HU-07, §6; aquí §4.4, §6 |
| C-04 | `open {mode}` solo puede ser `gesto`, `toque` o `teclado`; "experto" se registra al soltar en `execute.expert`. | spec §9; aquí §3.5 |
| C-05 | Soltar en `armado` con movimiento ≥ `UMBRAL_MOV` sin `pointermove` previo = moverse y soltar en `abierto_gesto`. | spec §3; aquí §3.3 fila 7 |
| C-06 | Modo toque con la regla del botón clásico: ejecuta solo si baja y sube sobre la misma opción moviéndose < 10 px, sin límite de tiempo; tocar el centro cierra a cualquier tiempo; con el dedo apoyado no corre el cierre por inactividad. | spec §3; aquí §3.3 filas 20–28 |
| C-07 | En descanso, el movimiento se mide desde donde empezó el descanso. | spec §3; aquí §3.3 fila 10 |
| C-08 | Soltar fuera del arco (fuera de 70°–200°) cancela con motivo `fuera_de_arco`. | spec §3; aquí §3.3 fila 14, §4.5 |
| C-09 | Una opción deshabilitada se ve atenuada, conserva su posición, se puede preseleccionar ("… · no disponible") y soltar sobre ella cancela. | spec §3, §7; aquí §3.3 fila 15 |
| C-10 | Prioridad por cercanía a la diagonal; empate según el parámetro `DESEMPATE` (`"horizontal"` por defecto). | spec §6; aquí §2, §4.4 |
| C-11 | `computeFanLayout` devuelve la geometría (`FanLayout`); `orderActions` + `assignActions` ponen los ids; `resolveSelection` recibe `hand`; se agrega `computeAnchorPosition`. | spec §7; aquí §4, §5 |
| C-12 | Estado `abierto_teclado` y evento `ACTIVAR` (lector de pantalla), ambos sin cierre por tiempo. | spec §3, RNF-05; aquí §3 |
| C-13 | El tipo de §7 no cambia; `validateScreen` exige `onUndo` en las reversibles (y el resto de reglas). | spec §7; aquí §5.1 |
| C-14 | Carta: Compartir (1), Favorito (2), Atrás. | spec §8; aquí §8 |
| C-15 | "Marcar no disponible" es de un plato: pasa al detalle de producto (dueño). RUTEANDO no tiene ícono para eso (solo la insignia de texto); se usa `MinusCircle` (libre; `Prohibit` = suspendido y `XCircle` = rechazado ya están tomados). Prioridades del producto: Editar (1), Marcar no disponible (2), Eliminar (3). | spec §8; aquí §8 |
| C-17 | "Uso" de una opción = ejecutarla. | spec HU-12 |
| C-18 | Fase 1 guarda solo la mano, con una clave que incluye la orientación. | spec §7 |
| C-19 | Si `onSelect` de una reversible falla, no hay deshacer y se muestra un aviso de error. | spec RF-08 |
| C-20 | Los campos de exportación son los de spec §9 hasta tener el Documento 8. En T-25: posición = altura + lado; errores = cancelaciones y bloqueos desde la ejecución anterior; se exportan también los eventos crudos (`apps/demo/src/lib/exportar.ts`). ✅ Interpretación aceptada el 25-09-2026. | spec §9 |
| C-22 | "Atrás" va a 90° aunque sea la única opción: `computeFanLayout` recibe `unicaArriba` (lo calcula `layoutParaPantalla`). Cualquier otra opción única sigue en la diagonal. | spec §6, §7; aquí §4.3 |
| C-21 | "Deshacer" **reemplaza** a la acción de prioridad 1 en su posición; nada más se mueve. Aviso y "Deshacer" siguen hasta vencer los 5 s aunque cambie la sección. Ícono `ArrowCounterClockwise`, registrado en `semantic-icons.ts` de la demo. | spec RF-08, §6, §8; aquí §4.4 |
| C-16 | `Heart` = marcar favorito; `ListHeart` = ver la lista de Favoritos. Secciones: `IdentificationCard` (perfil) y `Cube` (producto). `Storefront` nunca para secciones (= local fijo en RUTEANDO). Solo en la demo; RUTEANDO no se toca. | spec §8; aquí §8 |
| HM-01 | Hallazgo de prueba manual: el ancla quedaba demasiado abajo. Su altura es `ANCLA_ALTURA`, limitada entre un piso y un techo que deja caber el abanico y la banda. Después de probar en un Nubia Neo 3 GT: 0,38 (Bloque B) y luego **0,44** (Bloque C, con el ancla respondiendo al dedo). La demo mantiene el control deslizante en Ajustes. | spec §6, §12, D-17; aquí §2, §4.2, §8 |
| HM-02 | Una sola etiqueta en una **banda fija encima del abanico**, con fondo sólido. Texto: preselección / foco / dedo apoyado en modo toque; si no hay, el nombre de la sección, o "Desliza hacia una opción" durante la bienvenida. | spec RF-06, RF-06b, HU-12, §6, §12; aquí §4.6, §6 |
| API (T-16) | ✅ **Aceptada.** `AnchorProvider` recibe `icons: { back, undo }`: el ancla dibuja "Atrás" y "Deshacer", pero `AnchorScreen` no trae sus íconos, y los íconos se registran en la app (RNF-09). | spec §7; aquí §5.2 |
| Banda (T-16) | ✅ **Aceptada.** Con una irreversible preseleccionada, la banda agrega "· desliza más allá para confirmar", y con la confirmación armada "· suelta para confirmar": la regla de HU-08 se ve antes de soltar. | spec RF-06c; aquí §4.6 |
| Descanso (T-17) | ✅ **Aceptada.** En descanso el ancla sigue translúcida con un anillo sutil; el aspecto sólido y violeta queda para armar y para el menú abierto. | spec D-11 |
| Avisos (T-19) | ✅ **Aceptada.** Deshacer, bloqueado, error y "Confirmar" van justo encima de la banda, fuera del alcance del pulgar. | spec RF-08b; aquí §6 |
| Error asíncrono (T-19, C-19) | ✅ **Aceptada.** Si `onSelect` devuelve una promesa que falla: aviso "No se pudo completar la acción" y sin deshacer. Implementado; sin E2E porque ninguna acción de la demo es asíncrona. | spec RF-08b |
| Etiqueta deshabilitada (C-09) | ✅ **Aceptada.** Siempre "{etiqueta} · no disponible", aunque la etiqueta ya diga "no disponible". | spec RF-06c |
| HM-03 | Capas: "Cerrar" (id reservado `cerrar`) reemplaza lo que esté a 90° mientras haya una capa; pila; atrás del sistema por `history.pushState` + `popstate`; Escape. Métricas: `execute {id: "cerrar"}` y `layer_close {via}`. API: `useAnchorLayer(abierta, onClose)` devuelve `cerrar` (para la X propia; cierra por el historial), `icons.close`. Si la capa desaparece porque se navega, nunca se llama `history.back()` (desharía la navegación): solo se quita la marca y queda una entrada duplicada inofensiva. | spec D-10, RF-15, HU-14 |
| HM-04 | Teclado detectado por `visualViewport`: abierto si el alto visible cae más de 150 px bajo el máximo visto en esa orientación. Ya no depende del foco. | spec RF-16 |
| HM-05 | Las hojas se ubican sobre el borde inferior del `visualViewport` (`useTeclado().alto`). No se usa `interactive-widget`. | spec RF-16 |
| HM-06 / HM-08 | ✅ Todas A. Con capa: pantalla efectiva = la capa ("Cerrar" a 90° como si fuera "Atrás" + sus acciones); el fondo se oculta. Ícono y nombre de la capa en el centro, `aria-label` y banda. Deshacer reemplaza la prioridad 1 de la capa. Con teclado: id reservado `ocultar-teclado`, fijo a 180° (se agrega; con 5 opciones reemplaza a la de menor prioridad); `icons.hideKeyboard`; el ancla ya no se oculta y se ubica en el alto visible. | spec RF-13, RF-15, RF-17 |
| HM-09 | ⏳ Propuesta (desplazar tipo joystick), pendiente de visto bueno: `decisiones-pendientes.md`. | spec §12, P-01 |
| HM-07 | `useAnchorReserva()` = lado del ancla y ancho `MARGEN_LATERAL + D_ACTIVO`; las hojas de la demo reservan ese espacio. | spec RF-16 |
| L-02 | Margen lateral de 24 px (`MARGEN_LATERAL`); el inferior sigue en 16 px (`MARGEN_INFERIOR`). | spec §6, RF-12; aquí §2, §4.2 |
| L-04 | La acción se ejecuta de forma **síncrona al soltar**, sin esperar la animación. | aquí §6 ("Ejecutar") |
| L-09 | Se expone el 3002 igual que RUTEANDO expone el 3001: `portproxy` + regla del firewall, con `scripts/lan-3002.sh`, que genera los comandos de administrador y tú los ejecutas. `allowedDevOrigins` para que `next dev` hidrate por la IP de la LAN. | aquí §10, tasks T-12 |

---

## 1. Estructura del monorepo

npm workspaces, igual que RUTEANDO (no hay pnpm instalado y el equipo ya conoce npm).

```
boton-ancla/
├─ package.json              # workspaces: packages/*, apps/*; scripts raíz (test, typecheck, dev, e2e)
├─ tsconfig.base.json        # strict, ES2022, moduleResolution "bundler"
├─ CLAUDE.md
├─ specs/fase-1/{spec,design,tasks}.md
├─ packages/
│  ├─ core/                  # @boton-ancla/core — TypeScript puro (D-18, RNF-07)
│  │  ├─ package.json        # "exports": "./src/index.ts" (sin paso de build en Fase 1)
│  │  ├─ tsconfig.json       # "lib": ["ES2022"]  ← SIN "DOM": usar window/document no compila
│  │  ├─ vitest.config.ts    # environment: "node"
│  │  ├─ src/
│  │  │  ├─ index.ts         # API pública
│  │  │  ├─ params.ts        # Params + DEFAULT_PARAMS (§6)
│  │  │  ├─ types.ts         # AnchorAction, AnchorScreen, AnchorPrefs, Point, Rect, Insets, Slot
│  │  │  ├─ validate.ts      # validateScreen (máx. 5, ids únicos, onUndo si es reversible)
│  │  │  ├─ geometry.ts      # ángulos, distancias, espejo de mano
│  │  │  ├─ layout.ts        # computeAnchorPosition, computeFanLayout, assignActions
│  │  │  ├─ selection.ts     # resolveSelection
│  │  │  ├─ machine/
│  │  │  │  ├─ states.ts     # tipos AnchorState / AnchorEvent
│  │  │  │  ├─ transition.ts # función pura (estado, evento) → estado
│  │  │  │  ├─ deadline.ts   # proximoPlazo(estado): cuándo enviar TICK
│  │  │  │  └─ machine.ts    # createAnchorMachine: envoltorio con send/subscribe
│  │  │  ├─ metrics.ts       # tipos de eventos §9 + derivarMetricas(prev, next)
│  │  │  └─ welcome.ts       # conteo de usos por opción (HU-12), lógica pura
│  │  └─ test/*.test.ts
│  └─ react/                 # @boton-ancla/react — adaptador
│     ├─ package.json        # peerDependencies: react 19, react-dom 19; depende de @boton-ancla/core
│     └─ src/
│        ├─ index.ts
│        ├─ AnchorProvider.tsx
│        ├─ useAnchorScreen.ts
│        ├─ components/      # AnchorButton, AnchorFan, AnchorLabel, AnchorOverlay, AnchorNotice, AnchorWelcome
│        ├─ dom/             # safeArea, keyboard (visualViewport), orientation, vibrate, reducedMotion, storage
│        └─ anchor.css       # estilos propios con variables --ba-* (no depende de Tailwind)
└─ apps/
   └─ demo/                  # Next.js 16.3.4 + React 19.2.8 + TS 5 + Tailwind v4
      ├─ next.config.ts      # transpilePackages, devIndicators:false, allowedDevOrigins (L-09, L-12)
      ├─ postcss.config.mjs  # @tailwindcss/postcss
      ├─ playwright.config.ts
      ├─ e2e/                # helpers/gestos.ts + un archivo por HU
      └─ src/
         ├─ app/             # rutas de las pantallas simuladas (§8 de este doc)
         ├─ components/      # mapa falso, hojas inferiores, avisos de la demo
         └─ lib/
            ├─ icons/semantic-icons.ts   # copia del registro de RUTEANDO + íconos nuevos (RNF-09)
            └─ demo-store.tsx            # estado simulado (favoritos, rol, productos…)
```

**Por qué el adaptador no usa Tailwind:** el componente debe integrarse en cualquier app (D-19) y no todas usan Tailwind. `anchor.css` usa solo variables CSS (`--ba-accent`, `--ba-surface`, `--ba-border`, `--ba-text`, `--ba-text-muted`, `--ba-z`) que el `theme` del Provider rellena. La demo sí usa Tailwind v4 para sus pantallas, con los tokens de RUTEANDO en `:root` + `@theme inline` (copiados de `ruteando/client/src/app/globals.css`; ojo: `--color-terracota` hoy vale `#5b3df5`, violeta).

**Por qué sin paso de build:** en Fase 1 solo consume la demo. Next compila los paquetes con `transpilePackages` y Vitest lee TS directo. Publicar en npm (con `tsup`) es de la Fase 6.

---

## 2. Tipos base y parámetros (núcleo)

```ts
// types.ts
export type Point  = { x: number; y: number };
export type Rect   = { x: number; y: number; width: number; height: number };
export type Insets = { top: number; right: number; bottom: number; left: number };
export type Hand   = "right" | "left";
export type ActionKind = "normal" | "reversible" | "irreversible";

// params.ts — mismos nombres que §6 para poder rastrearlos
export type Params = {
  D_REPOSO: number;        // 52
  D_ACTIVO: number;        // 64
  D_OPCION: number;        // 44
  ESCALA_PRESEL: number;   // 1.25
  OPACIDAD_REPOSO: number; // 0.6
  MARGEN_LATERAL: number;  // 24 (se suma el área segura) — L-02
  MARGEN_INFERIOR: number; // 16 (se suma el área segura) — piso del ancla
  ANCLA_ALTURA: number;    // 0.44 — fracción del alto útil sobre el borde inferior (HM-01)
  BANDA_ALTO: number;      // 28 — alto de la banda de etiqueta (HM-02)
  BANDA_MARGEN: number;    // 8 — espacio entre la opción de arriba y la banda (HM-02)
  R_MUERTA: number;        // 24
  R_ARCO: number;          // 100 — radio MÍNIMO; ver radio adaptativo en §4.3 (C-01)
  SEPARACION_MIN: number;  // 0 — espacio mínimo entre opciones vecinas (C-01)
  EXTRA_EXTERIOR: number;  // 48 → R_EXTERIOR = radioEfectivo + 48
  ARCO_DESDE: number;      // 90  (arriba)
  ARCO_HASTA: number;      // 180 (izquierda) — para la mano izquierda se refleja
  EXT_EXTREMOS: number;    // 20
  HISTERESIS: number;      // 8
  UMBRAL_MOV: number;      // 10
  T_TOQUE: number;         // 250
  T_DESCANSO: number;      // 400
  T_INACTIVO: number;      // 4000
  T_DESHACER: number;      // 5000
  T_ANIM: number;          // 140
  VIB_MS: number;          // 10
  USOS_ETIQUETA: number;   // 5
  MAX_OPCIONES: number;    // 5
  DESEMPATE: "horizontal" | "vertical";  // "horizontal" (C-10)
};
export const DEFAULT_PARAMS: Params = { /* valores de §6 */ };
```

---

## 3. Máquina de estados (§3)

### 3.1 Principio
`transition(estado, evento) → estado` es **pura**: no lee el reloj, no toca el DOM, no llama `onSelect`. Todo lo que necesita viene dentro del evento (punto, tiempo `t`, geometría). El adaptador:
1. lee el tiempo con `performance.now()` (no `event.timeStamp`, ver L-07) y arma el evento;
2. llama `transition`;
3. compara el estado anterior con el nuevo y ejecuta los efectos (vibrar, `onSelect`, avisos, métricas);
4. si el nuevo estado es **transitorio** (`ejecutando`, `cancelado`, `bloqueado_sensible`), ejecuta su efecto y envía `COMPLETADO`, que lleva a `reposo`.

Así se respeta al pie de la letra "sin efectos secundarios dentro de la máquina".

### 3.2 Tipos

```ts
// Foto de la geometría al empezar la interacción; la máquina la guarda y no depende del DOM.
export type Geometry = {
  centro: Point;
  slots: Slot[];                 // con id asignado (ver §4.3)
  params: Params;
  hand: Hand;
};

type Base = { pointerId: number; inicio: Point; t0: number; geo: Geometry };
type Gesto = Base & {
  tApertura: number;             // cuándo se superó UMBRAL_MOV
  modoApertura: "gesto" | "toque";
  presel?: string;               // id preseleccionado
  recorridoPx: number;           // longitud del trayecto (métrica pathPx)
  ultimo: Point;
};

export type AnchorState =
  | { tipo: "reposo" }
  | ({ tipo: "armado" } & Base)
  | ({ tipo: "descanso"; puntoDescanso: Point } & Base)                         // C-07
  | ({ tipo: "abierto_gesto" } & Gesto)
  | ({ tipo: "confirmacion_armada"; presel: string } & Gesto)
  | { tipo: "abierto_toque"; geo: Geometry; tApertura: number; ultimaActividad: number;
      presion?: { pointerId: number; inicio: Point; t0: number; sobre: "centro" | { id: string } } }  // C-06
  | { tipo: "confirmacion_toque"; geo: Geometry; id: string; ultimaActividad: number }
  | { tipo: "abierto_teclado"; geo: Geometry; foco: number }                    // C-12
  // transitorios
  | { tipo: "ejecutando"; id: string; modo: "gesto" | "toque" | "teclado";
      experto: boolean; ms: number; recorridoPx: number }
  | { tipo: "cancelado"; motivo: CancelReason }
  | { tipo: "bloqueado_sensible"; id: string };

export type CancelReason =
  | "zona_muerta" | "fuera_de_arco" | "deshabilitada"          // C-08, C-09
  | "toque_centro" | "toque_fuera" | "inactividad" | "escape"
  | "segundo_dedo" | "pointercancel" | "orientacion" | "cambio_seccion";

export type AnchorEvent =
  | { tipo: "POINTER_DOWN"; pointerId: number; punto: Point; t: number;
      sobre: "ancla" | { id: string } | "fuera"; geo?: Geometry }   // geo solo al presionar el ancla en reposo
  | { tipo: "POINTER_MOVE"; pointerId: number; punto: Point; t: number }
  | { tipo: "POINTER_UP";   pointerId: number; punto: Point; t: number }
  | { tipo: "POINTER_CANCEL" }
  | { tipo: "TICK"; t: number }                  // lo envía el adaptador en proximoPlazo(estado)
  | { tipo: "CONFIRMAR"; t: number }             // botón "Confirmar" de confirmacion_toque
  | { tipo: "ACTIVAR"; t: number; geo: Geometry }  // click sin secuencia de puntero (lector de pantalla) — C-12
  | { tipo: "TECLA"; tecla: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Home" | "End"
      | "Enter" | " " | "Escape"; t: number; geo?: Geometry }
  | { tipo: "ORIENTACION" } | { tipo: "CAMBIO_SECCION" }
  | { tipo: "COMPLETADO" };
```

El "segundo dedo" no es un evento aparte: es un `POINTER_DOWN` con `pointerId` distinto mientras hay un puntero activo.

### 3.3 Tabla de transiciones

Notación: `d` = distancia del puntero a `inicio` (movimiento); `r` = distancia a `geo.centro` (selección); `Δt = t − t0`; `sel = resolveSelection(...)`; `P` = params.

| # | Estado | Evento | Condición | → Estado | Notas / origen |
|---|---|---|---|---|---|
| 1 | reposo | POINTER_DOWN sobre ancla | — | armado | RF-01 (captura en adaptador) |
| 2 | reposo | ACTIVAR | — | abierto_toque | C-12, lector de pantalla |
| 3 | reposo | TECLA Enter/Espacio/ArrowUp | foco en el ancla | abierto_teclado (foco = prioridad 1) | RNF-05, C-12 |
| 4 | armado | POINTER_MOVE | `d > UMBRAL_MOV` y `Δt < T_DESCANSO` | abierto_gesto (`tApertura = t`, presel = sel) | §3 |
| 5 | armado | POINTER_UP | `d < UMBRAL_MOV` y `Δt < T_TOQUE` | abierto_toque | §3, HU-05 |
| 6 | armado | POINTER_UP | `d < UMBRAL_MOV` y `T_TOQUE ≤ Δt` | reposo | §3 (sin efecto) |
| 7 | armado | POINTER_UP | `d ≥ UMBRAL_MOV` (llegó sin MOVE) | igual que MOVE + UP en abierto_gesto | **C-05**, HU-06 |
| 8 | armado | TICK | `Δt ≥ T_DESCANSO` | descanso (`puntoDescanso` = último punto) | D-11, HU-04 |
| 9 | descanso | POINTER_UP | — | reposo | §3 |
| 10 | descanso | POINTER_MOVE | distancia a `puntoDescanso` > `UMBRAL_MOV` | abierto_gesto | §3, **C-07** |
| 11 | abierto_gesto | POINTER_MOVE | — | abierto_gesto (presel = sel con histéresis) | RF-02..05 |
| 12 | abierto_gesto | POINTER_MOVE | presel irreversible y `sel.beyondOuter` | confirmacion_armada | §3, RF-07 |
| 13 | abierto_gesto | POINTER_UP | `r < R_MUERTA` | cancelado(zona_muerta) | D-10, HU-03 |
| 14 | abierto_gesto | POINTER_UP | sin sector (fuera del arco) | cancelado(fuera_de_arco) | **C-08** |
| 15 | abierto_gesto | POINTER_UP | presel deshabilitada | cancelado(deshabilitada) | **C-09** |
| 16 | abierto_gesto | POINTER_UP | presel normal o reversible | ejecutando (`experto = t − tApertura < T_ANIM`) | D-08, HU-01/06 |
| 17 | abierto_gesto | POINTER_UP | presel irreversible, sin pasar el anillo | bloqueado_sensible | D-14, HU-08 |
| 18 | confirmacion_armada | POINTER_MOVE | vuelve dentro del anillo **o** cambia de sector | abierto_gesto | §3 |
| 19 | confirmacion_armada | POINTER_UP | — | ejecutando | HU-08 |
| 20 | abierto_toque | POINTER_DOWN sobre opción | — | abierto_toque (`presion` = opción) | C-06 |
| 21 | abierto_toque | POINTER_UP | `presion` en opción, misma opción, `d < UMBRAL_MOV`, normal/reversible | ejecutando(modo toque) | HU-05 |
| 22 | abierto_toque | POINTER_UP | ídem pero irreversible | confirmacion_toque | §3 |
| 23 | abierto_toque | POINTER_UP | `presion` en opción pero se movió o soltó en otra | abierto_toque (sin efecto) | C-06 |
| 24 | abierto_toque | POINTER_DOWN sobre ancla | — | abierto_toque (`presion` = centro) | §3 |
| 25 | abierto_toque | POINTER_MOVE | `presion` en centro y `d > UMBRAL_MOV` | abierto_gesto (`modoApertura = "toque"`) | §3, HU-09 |
| 26 | abierto_toque | POINTER_UP | `presion` en centro y `d < UMBRAL_MOV` (cualquier tiempo) | cancelado(toque_centro) | §3, C-06 |
| 27 | abierto_toque | POINTER_DOWN fuera | — | cancelado(toque_fuera) | RF-11 |
| 28 | abierto_toque | TICK | sin `presion` y `t − ultimaActividad ≥ T_INACTIVO` | cancelado(inactividad) | HU-05 |
| 29 | confirmacion_toque | CONFIRMAR | — | ejecutando(modo toque) | §3 |
| 30 | confirmacion_toque | POINTER_DOWN fuera / TICK vencido / TECLA Escape | — | cancelado(toque_fuera / inactividad / escape) | §3 |
| 31 | abierto_teclado | TECLA flecha / Home / End | — | abierto_teclado (mueve foco) | RNF-05, C-12 |
| 32 | abierto_teclado | TECLA Enter/Espacio | normal/reversible → ejecutando(modo teclado); irreversible → confirmacion_toque | RNF-05 |
| 33 | abierto_teclado | TECLA Escape | — | cancelado(escape) | RNF-05 |
| 34 | ejecutando / cancelado / bloqueado_sensible | COMPLETADO | — | reposo | el adaptador ya hizo el efecto |
| 35 | **cualquiera salvo reposo y transitorios** | POINTER_DOWN con otro `pointerId` | — | cancelado(segundo_dedo) | RF-09 |
| 36 | ídem | POINTER_CANCEL / ORIENTACION / CAMBIO_SECCION | — | cancelado(motivo) | RF-09, RF-10 |
| 37 | cualquiera | cualquier otro evento | — | mismo estado (se ignora) | total: nunca lanza error |
| 38 | abierto_toque | TECLA Escape | — | cancelado(escape) | RNF-05 (Escape cierra el menú) |
| 39 | abierto_toque | TECLA flecha | — | abierto_teclado (foco = prioridad 1) | RNF-05 (se navega con flechas) |
| 40 | abierto_teclado | POINTER_DOWN fuera | — | cancelado(toque_fuera) | RF-11 |

`abierto_toque` y `confirmacion_toque` actualizan `ultimaActividad = t` con cualquier evento de puntero o teclado.

### 3.4 Temporizadores

```ts
proximoPlazo(estado): number | undefined
// armado             → t0 + T_DESCANSO
// abierto_toque      → ultimaActividad + T_INACTIVO   (si no hay presión en curso)
// confirmacion_toque → ultimaActividad + T_INACTIVO
// resto              → undefined
```
El adaptador mantiene **un solo** `setTimeout` hacia ese plazo y envía `TICK`. Así la máquina sigue pura y se prueba en Vitest pasando `t` a mano, sin temporizadores falsos.

### 3.5 Métricas derivadas (§9)
`derivarMetricas(prev, next, evento): MetricEvent[]` (pura, en el núcleo):

| Cambio | Evento |
|---|---|
| → abierto_gesto (desde armado/descanso/abierto_toque) | `open {mode:"gesto"}` |
| armado → abierto_toque | `open {mode:"toque"}` |
| reposo → abierto_teclado | `open {mode:"teclado"}` (C-04, modo nuevo) |
| cambia `presel` a un id | `preselect {id}` |
| → ejecutando | `execute {id, ms, pathPx, expert}` |
| → cancelado | `cancel {reason}` |
| armado → descanso | `rest_enter` |
| → bloqueado_sensible | `sensitive_blocked {id}` |
| (desde el aviso, fuera de la máquina) | `undo {id}` |

"Experto" no se sabe al abrir, solo al soltar (C-04): se reporta en `execute.expert`.

Matices implementados en `derivarMetricas` (T-10):
- Deslizamiento relámpago (C-05): `armado` → final con `POINTER_UP` también emite `open {mode:"gesto"}`, aunque nunca se vio `abierto_gesto`.
- Con teclado, mover el foco emite `preselect {id}`.
- `execute` lleva además `mode` (gesto, toque o teclado), y `pathPx` se redondea a px enteros.
- Ejecutar "Deshacer" no emite `execute`: el adaptador emite `undo {id}` con el id de la acción original.

---

## 4. Geometría

### 4.1 Convención de ángulos
Grados, 0° = derecha, 90° = arriba, 180° = izquierda (eje y hacia arriba, aunque la pantalla lo tenga hacia abajo):
`angulo = atan2(centro.y − p.y, p.x − centro.x)` normalizado a `[0, 360)`.
**Mano izquierda:** todo se calcula en "espacio de mano derecha" reflejando `x` alrededor del centro (`θ' = 180° − θ`). Así el orden relativo al pulgar se conserva (HU-11) y no hay dos implementaciones.

### 4.2 Posición del ancla
```ts
computeAnchorPosition({ viewport, safeArea, hand, params }): Point
// x = right  : viewport.width  − safeArea.right − MARGEN_LATERAL − D_ACTIVO/2
//     left   : safeArea.left + MARGEN_LATERAL + D_ACTIVO/2
//
// Altura (HM-01). Con arriba = viewport.y + safeArea.top y abajo = viewport.y + height − safeArea.bottom:
//   piso    = abajo − MARGEN_INFERIOR − D_ACTIVO/2                      (lo más abajo posible)
//   techo   = arriba + BANDA_ALTO + BANDA_MARGEN + radioAdaptativo(MAX_OPCIONES) + D_OPCION·ESCALA_PRESEL/2
//             (caben el abanico de 5 y la banda de etiqueta, HM-02)
//   deseada = abajo − ANCLA_ALTURA · (abajo − arriba)
//   y = min(piso, max(techo, deseada))   // si chocan (pantalla diminuta), gana el piso
```
Se usa `D_ACTIVO` (no `D_REPOSO`) para que al crecer no se salga del margen. El techo usa el radio de 5 opciones aunque la pantalla tenga menos, así el ancla no cambia de altura al pasar de una sección a otra.

Ejemplo, 375 × 667 sin área segura: piso = 619, techo ≈ 176,5, deseada = 667 − 0,44 · 667 ≈ 373,5 → el ancla queda a ~293 px del borde inferior. Con `ANCLA_ALTURA = 0` se obtiene la posición anterior (48 px).

### 4.3 Abanico — `computeFanLayout` (firma de §7)
```ts
type FanSlot = {
  index: number;           // 0 = extremo "arriba" … n−1 = extremo lateral
  anguloBase: number;      // en espacio de mano derecha: 90° … 180°
  angulo: number;          // el real en pantalla (reflejado con la mano izquierda: 180° − anguloBase)
  punto: Point;            // centro de la opción en pantalla
  sector: { desde: number; hasta: number };  // en espacio de mano derecha, incluye EXT_EXTREMOS
};
type FanLayout = {
  radio: number;           // radio adaptativo (C-01)
  rExterior: number;       // radio + EXTRA_EXTERIOR
  slots: FanSlot[];
  fueraDePantalla: boolean;  // true si alguna opción escalada se sale de la zona útil (RF-12)
};
computeFanLayout({ anchor, viewport, safeArea, count, hand, params, unicaArriba? }): FanLayout

// Atajo que usa el adaptador: ordena, calcula la geometría (con unicaArriba) y asigna.
layoutParaPantalla({ screen, viewport, safeArea, hand, params, deshacer? }): { anchor: Point; layout: FanLayout; slots: Slot[] }
```
**Decidido (C-01):**
- Las opciones se reparten **en los extremos del arco**: con `n` opciones, ángulos `ARCO_DESDE + i·(ARCO_HASTA − ARCO_DESDE)/(n−1)`; con 1 opción, la diagonal (135°), salvo que `unicaArriba` sea verdadero: entonces `ARCO_DESDE` (90°), porque esa opción única es "Atrás" (C-22); con 0, ninguna.
- **Radio adaptativo** `R = max(R_ARCO, (D_OPCION + SEPARACION_MIN) / (2·sin(Δ/2)))`, con `Δ` = separación angular entre vecinas. Con los valores por defecto da 100 px con 2–4 opciones y 113 px con 5. `R_EXTERIOR = R + EXTRA_EXTERIOR`. Para la prueba manual se ajusta `R_ARCO` o `SEPARACION_MIN` desde `params` del Provider.
- Punto en pantalla: `x = anchor.x + R·cos(angulo)`, `y = anchor.y − R·sin(angulo)` (la `y` de la pantalla crece hacia abajo).
- Sectores: bisectrices entre ángulos vecinos; el primero empieza en `ARCO_DESDE − EXT_EXTREMOS` (70°) y el último termina en `ARCO_HASTA + EXT_EXTREMOS` (200°). Con 1 opción, su sector es todo ese rango.
- **Zona útil (RF-12):** el viewport menos el área segura, menos `MARGEN_LATERAL` a izquierda y derecha y `MARGEN_INFERIOR` abajo (arriba solo el área segura: el abanico nunca llega cerca). Cada opción a tamaño `D_OPCION·ESCALA_PRESEL` debe caber entera. En vertical siempre cabe (ancla a 56 px del borde lateral y 48 px del inferior; alcance máximo 113 + 27,5 px). Si no cabe, se marca `fueraDePantalla` en lugar de mover opciones en silencio; las pruebas lo verifican en 320, 375, 412 y 430 px.

### 4.4 Asignación por prioridad — `orderActions` y `assignActions` (C-10, C-11, C-21)
```ts
type OrderedAction = { id: string; kind: ActionKind; disabled: boolean };
type Slot = FanSlot & OrderedAction;

orderActions(screen: AnchorScreen, opciones?: { deshacer?: boolean }): OrderedAction[]
assignActions(layout: FanLayout, ordered: OrderedAction[], params: Params): Slot[]  // en orden de index
```
**Decidido (C-10, C-21):**
1. `orderActions`: si la pantalla trae `back`, la primera es la opción fija `"atras"`. Después, las acciones ordenadas por `priority` de menor a mayor; las que no tienen `priority` van al final en el orden en que se declararon (orden estable). `kind` por defecto `"normal"`, `disabled` por defecto `false`.
2. Con `opciones.deshacer`, la acción de **prioridad 1** (la primera después de "Atrás") se **reemplaza** por `{ id: "deshacer", kind: "normal", disabled: false }`; nada más cambia. Si la pantalla no tiene acciones propias, "Deshacer" se agrega como única.
3. `assignActions`: "atras" va **siempre** al slot de `ARCO_DESDE` (arriba, pegado al borde).
4. Los slots libres se ordenan por cercanía a la diagonal `(ARCO_DESDE + ARCO_HASTA)/2` = 135°. Empate: con `DESEMPATE = "horizontal"` (por defecto) gana el de ángulo mayor (más cerca de 180°); con `"vertical"`, el menor. La prioridad 1 toma el primero, la 2 el segundo, etc.
5. Si el número de acciones no coincide con el de slots, `assignActions` lanza un error: es un error de programación, no del usuario.

Ejemplos con la mano derecha:
- Mapa (4): Buscar 150°, Mi ubicación 120°, Ofertas cerca 180°, Favoritos 90°.
- Perfil visitante (4 + Atrás): Atrás 90°, Carta 135°, Cómo llegar 157,5°, Favorito 112,5°, Compartir 180°.
- Producto dueño (3 + Atrás): Atrás 90°, Editar 150°, Marcar no disponible 120°, Eliminar 180°.
- Producto dueño con aviso de deshacer: Atrás 90°, **Deshacer 150°**, Marcar no disponible 120°, Eliminar 180° (Editar queda oculta hasta que vence el aviso).

Ejecutar "Deshacer" llama `onUndo` de la acción original y registra `undo {id}` (no `execute`). El aviso y "Deshacer" siguen hasta vencer `T_DESHACER` aunque cambie la sección. Ícono: `ArrowCounterClockwise`.

### 4.6 Banda de etiqueta (HM-02, RF-06b)

Núcleo, puro:
```ts
posicionBanda({ anchor, layout, viewport, safeArea, hand, params }): { x: number; yBase: number; anchoMax: number }
// x      = centro horizontal del arco: anchor.x ∓ radio/2 (se refleja con la mano)
// yBase  = borde de abajo de la banda = anchor.y − radio − D_OPCION·ESCALA_PRESEL/2 − BANDA_MARGEN
// anchoMax = ancho útil (viewport − áreas seguras − 2·MARGEN_LATERAL)
// El adaptador mide el texto y desplaza la banda para que no se salga por los costados.

textoBanda({ estado, screen, bienvenida }): { texto: string; tipo: "opcion" | "seccion" | "pista" } | null
// null si el menú no está abierto (reposo, armado, descanso, transitorios)
// abierto_gesto / confirmacion_armada con presel → label de la opción ("… · no disponible" si está deshabilitada, C-09)
// abierto_teclado → label de la opción con foco
// abierto_toque con el dedo sobre una opción → su label
// confirmacion_toque → label de la opción a confirmar
// sin nada de lo anterior → bienvenida activa ? "Desliza hacia una opción" : screen.sectionLabel
```
"Bienvenida activa" = alguna opción de la pantalla todavía está por debajo de `USOS_ETIQUETA` usos (`mostrarEtiqueta`, T-11).

Con 375 × 667, `ANCLA_ALTURA` 0,44 y 5 opciones, la banda queda en y ≈ 373 − 113 − 27,5 − 8 ≈ 225 (borde de abajo): por encima de todo lo que alcanza el pulgar.

### 4.5 Selección — `resolveSelection` (firma de §7)
```ts
resolveSelection({ center, pointer, slots, previous, params, hand }):
  { id?: string; beyondOuter: boolean; distancia: number; angulo: number }
```
1. `r < R_MUERTA` → sin id (RF-02). La zona muerta gana a la histéresis.
2. Ángulo fuera de `[70°, 200°]` → sin id (C-08).
3. Si hay `previous` y el ángulo sigue dentro de su sector ampliado ±`HISTERESIS` → se mantiene (RF-04).
4. Si no, el slot cuyo sector contiene el ángulo (RF-03, RF-05).
5. `beyondOuter = r > R_EXTERIOR` (RF-07).

Se añade `hand` a la entrada (la firma de §7 no lo trae y hace falta para el espejo).

---

## 5. API pública (§7)

### 5.1 Núcleo
```ts
export type AnchorIcon = unknown;
export type AnchorAction = { id; icon; label; onSelect; priority?; kind?; onUndo?; undoMessage?; disabled? }; // igual que §7
export type AnchorScreen = { id; sectionIcon; sectionLabel; back?; actions };                            // igual que §7
export type AnchorPrefs  = { hand: Hand };

export function createAnchorMachine(params?: Partial<Params>): Machine;
export type Machine = {
  getState(): AnchorState;
  send(evento: AnchorEvent): AnchorState;              // aplica transition y avisa a los suscriptores
  subscribe(fn: (next: AnchorState, prev: AnchorState, evento: AnchorEvent) => void): () => void;
  nextDeadline(): number | undefined;
  params: Params;
};
export function transition(estado: AnchorState, evento: AnchorEvent): AnchorState;
export function computeAnchorPosition(...): Point;
export function computeFanLayout(...): FanLayout;
export function orderActions(screen, opciones?): OrderedAction[];
export function assignActions(layout, ordered, params): Slot[];
export function resolveSelection(...);
export function validateScreen(screen: AnchorScreen, params: Params): string[];  // lista de errores
export function derivarMetricas(prev, next, evento): MetricEvent[];
export type MetricEvent = /* §9 */;
```
`validateScreen` impone lo que el tipo de §7 no puede: máximo 5 contando "Atrás", ids únicos, `onUndo` obligatorio si `kind = "reversible"` (C-13). En desarrollo, el adaptador lanza el error; en producción lo avisa por consola y no muestra las opciones inválidas.

### 5.2 Adaptador React
```tsx
export type ReactAnchorIcon = React.ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill"; "aria-hidden"?: boolean }>;
// compatible con los íconos de Phosphor

export type AnchorTheme = { accent: string; surface: string; border: string; text: string; textMuted: string };
// en RUTEANDO: { accent: "var(--color-terracota)", surface: "var(--color-surface)", ... } (D-19)

<AnchorProvider
  prefs={{ hand: "right" }}
  theme={theme}
  icons={{ back: ArrowLeft, undo: ArrowCounterClockwise }}   // opciones fijas (RNF-09: íconos de la app)
  onEvent={(e: MetricEvent) => void}
  params={Partial<Params>}          // opcional, para ajustar con las pruebas
  storage={Storage}                 // opcional (usos de bienvenida); por defecto localStorage con try/catch
>…</AnchorProvider>

useAnchorScreen(screen: AnchorScreen): void;
```
- `useAnchorScreen` detecta el cambio de sección **por `screen.id`**, no por identidad del objeto (si no, cada render cancelaría la interacción, RF-10). Las `actions` más recientes se guardan en un `ref`, así los `onSelect` definidos en línea siempre están al día.
- Si dos pantallas llaman al hook a la vez, gana la última montada (se documenta; en la demo nunca ocurre).

---

## 6. Adaptador React: cómo cumple cada requisito

| Tema | Cómo | Req. |
|---|---|---|
| Render | Portal a `document.body`, `position: fixed`, `z-index: var(--ba-z, 1100)` (> `z-[1000]` de las hojas de RUTEANDO). Fuera del contenedor del mapa, así los eventos no burbujean a Leaflet. | RF-14, D-17, HU-13 |
| Captura | `pointerdown` en el `<button>`: `preventDefault()`, `setPointerCapture` dentro de `try/catch` (L-07). `pointermove/up/cancel` en el mismo botón. | RF-01 |
| Segundo dedo / toque fuera | Mientras no está en reposo: listener de `pointerdown` en `window` en fase de captura. | RF-09, RF-11 |
| Toques fuera en modo toque | `AnchorOverlay` transparente a pantalla completa bajo el abanico; se retira después del `click` compatible o a los 350 ms, para evitar el clic fantasma (L-06). | RF-11, D-13 |
| CSS del gesto | `touch-action:none; user-select:none; -webkit-user-select:none; -webkit-touch-callout:none` en ancla y opciones; `contextmenu` con `preventDefault`; `touchstart` no pasivo con `preventDefault` en iOS. | RNF-02, L-05 |
| Animación | Solo `transform` y `opacity`, duración `T_ANIM`. `backdrop-filter` solo en el ancla. Con `prefers-reduced-motion: reduce`, solo `opacity`. | RNF-03, RNF-04 |
| Reposo | Fondo `color-mix(in srgb, var(--ba-surface) 60%, transparent)` + `backdrop-filter: blur(12px)` + borde `--ba-border`; ícono de la sección. **Decidido (C-02):** ícono en color `--ba-text` en reposo y `--ba-accent` solo en activo. | D-04, RNF-06 |
| Preselección | Opción a `scale(1.25)`, su nombre en la **banda de etiqueta** (§4.6), centro con el ícono de la opción, `vibrar(VIB_MS)` si existe `navigator.vibrate`. | RF-06, RF-06b, D-09, D-02 |
| Irreversible | Al preseleccionarla se dibuja el anillo `R_EXTERIOR`; en `confirmacion_armada` se rellena. | RF-07 |
| Ejecutar | `onSelect()` se llama **de forma sincrónica** dentro del manejador de `pointerup`/`click`/`keydown`, antes de `COMPLETADO`. Necesario para que iOS abra el teclado en HU-01 (L-04). Primero se registra `execute` y después se llama `onSelect`, para que un cambio de sección provocado por la acción no se cuente como cancelación. | HU-01, RF-10 |
| Aviso | `AnchorNotice` (`role="status"`, `aria-live="polite"`): deshacer (`T_DESHACER`; tocarlo deshace, y además "Deshacer" entra al abanico en la posición de prioridad 1, §4.4), "Desliza más allá para confirmar", y "Confirmar" en modo toque. Se ubica encima del ancla, sin taparla. | RF-08, D-14, C-03 |
| Área segura | Elemento sonda oculto con `padding: env(safe-area-inset-*)` leído con `getComputedStyle`; requiere `viewport-fit=cover` en la app. | RF-12, L-03 |
| Teclado virtual | `visualViewport` (`resize`/`scroll`): si `window.innerHeight − visualViewport.height > 150 px` → ocultar el ancla (por defecto) y cancelar. | RF-13, L-04 |
| Orientación | `screen.orientation` `change`, con respaldo `matchMedia("(orientation: portrait)")`. | RF-09 |
| Accesibilidad | `<button aria-haspopup="menu" aria-expanded aria-controls>` con nombre "Menú, sección {sectionLabel}"; contenedor `role="menu"`; opciones `role="menuitem"` con `aria-disabled`; foco itinerante con flechas. | RNF-05 |
| Bienvenida | Primer arranque: una opción sale y vuelve (solo opacidad con movimiento reducido). Etiquetas visibles hasta `USOS_ETIQUETA` ejecuciones por opción (C-17). | HU-12 |
| Almacenamiento | `localStorage` con claves `boton-ancla:v1:*`, todo en `try/catch`. Sin datos anatómicos. | RNF-08 |

---

## 7. Pruebas

- **Vitest (núcleo):** una prueba por fila de la tabla §3.3; geometría con anchos 320/375/412/430 × mano × 1–5 opciones; `resolveSelection` con zona muerta, bordes con histéresis, extremos, anillo exterior; `derivarMetricas`.
- **Playwright (demo):** proyectos `Pixel 7` (Chromium) y `iPhone 14` (WebKit), `hasTouch`. Helper `e2e/helpers/gestos.ts`:
  - `presionar / mover / soltar / deslizar(desde, hasta, { pasos, ms })`
  - Chromium: toques reales con CDP `Input.dispatchTouchEvent`.
  - WebKit: `PointerEvent` sintéticos (`pointerType: "touch"`), porque Playwright solo trae `tap()` y WebKit no tiene CDP (L-07).
  - Tiempos (400 ms, 4 s, 5 s) con `page.clock`.
- **Manual:** lista de §10.3 de la spec, al final de cada tarea con UI y completa al cierre.

---

## 8. Demo: pantallas simuladas (§8)

Estado simulado en memoria (`demo-store.tsx`): rol (visitante/dueño), favoritos, disponibilidad, productos, fondo del mapa. Rutas del App Router, cada una llama a `useAnchorScreen`:

| Ruta | Sección (ícono centro) | Acciones del ancla (prioridad) → qué hace en la demo |
|---|---|---|
| `/mapa` | Mapa `MapTrifold` | Buscar `MagnifyingGlass` (1) → hoja inferior con campo enfocado y teclado · Mi ubicación `Crosshair` (2) → recentra el mapa falso · Ofertas cerca `Tag` (3) → hoja inferior con lista · Favoritos `ListHeart` (4) → hoja con favoritos (C-16) |
| `/negocio` (visitante) | Perfil de negocio `IdentificationCard` | Carta `BookOpen` (1) → `/negocio/carta` · Cómo llegar `NavigationArrow` (2) → aviso simulado · Favorito `Heart` (3) → alterna · Compartir `ShareNetwork` (4) → aviso "Enlace copiado (simulado)" (L-10) · Atrás `ArrowLeft` |
| `/negocio?rol=dueno` | Perfil de negocio `IdentificationCard` | Agregar plato `PlusCircle` (1) → hoja con formulario · Editar `PencilSimple` (2) → hoja · Atrás |
| `/negocio/carta` | Carta `BookOpen` | Compartir `ShareNetwork` (1) → aviso simulado · Favorito `Heart` (2) → alterna · Atrás. Lista de productos; tocar uno → `/producto` |
| `/producto/[id]` (dueño) | Detalle de producto `Cube` | Editar `PencilSimple` (1) → hoja · Marcar no disponible `MinusCircle` (2, reversible) → insignia "No disponible" + aviso "Marcado no disponible · Deshacer" · Eliminar `Trash` (3, irreversible) → quita el producto y vuelve a la carta · Atrás |
| `/ajustes` | Ajustes `GearSix` | Atrás. Pantalla: mano derecha/izquierda (HU-11), rol, fondo del mapa, reiniciar bienvenida |
| `/metricas` | Métricas `ChartBar` | Atrás. Lista de eventos, formulario Doc 8 §13 y exportar JSON (§9, RNF-08) |

- **Mapa falso** (`components/fake-map.tsx`): lienzo SVG grande que se arrastra con puntero (`touch-action:none`) con pines de negocios. Sin Leaflet ni teselas externas: la E2E no depende de internet y se prueba HU-13 igual. Fondo seleccionable: *mapa claro*, *foto* (imagen local en `public/`), *oscuro*, para la revisión de legibilidad de §10.3.
- **Hojas inferiores** con `z-[1000]`, como en RUTEANDO, para probar RF-14.
- Barra superior mínima con "Atrás" y enlaces a Diagnóstico, Métricas y Ajustes (navegación de la demo, fuera del alcance del ancla; HU-09 cubre las acciones del ancla).
- **Vista previa fantasma** (`components/vista-previa-ancla.tsx`): el ancla y el abanico de la pantalla actual dibujados con líneas punteadas, calculados con `layoutParaPantalla`. No responde al toque. Sirve para juzgar la altura (HM-01) hasta que llegue el ancla real (T-15), que la reemplaza.
- En Ajustes: control deslizante de `ANCLA_ALTURA` (0–60 %, se usa solo deslizando), mano, rol, fondo del mapa y "mostrar abanico de referencia". Las preferencias se guardan en `localStorage` (`boton-ancla-demo:v1:prefs`).
- `/diagnostico` conserva la página de T-12. `/` redirige a `/mapa`.
- Las definiciones de pantalla son funciones puras (`lib/pantallas.ts`) probadas con `validateScreen`; `components/pantallas-conectadas.ts` les pone las acciones reales.
- Producto no disponible: "Marcar no disponible" queda deshabilitada (C-09). El detalle de producto solo se abre con rol Dueño (C-14).
- `semantic-icons.ts` de la demo copia el de RUTEANDO y registra los íconos nuevos; registrarlos en RUTEANDO es parte de la integración, no de este repo.

---

## 9. Contradicciones y ambigüedades de la spec

Todas decididas; el detalle está en §0 y en `spec.md` v0.3. Se mantiene la lista para rastrear de dónde salió cada regla.

| ID | Tema | Problema original (resumen) | Estado |
|---|---|---|---|
| C-01 | Abanico | 5 opciones de 44 px se enciman con R = 100 px en 90° | ✅ radio adaptativo |
| C-02 | Contraste | `terracota` sobre fondo al 60 % da 2,15:1 sobre contenido oscuro | ✅ ícono `text` en reposo |
| C-03 | Deshacer | "Deshacer" exigía un toque (choca con D-15) | ✅ en la posición de prioridad 1 |
| C-04 | Métrica `open` | "experto" no se sabe al abrir | ✅ va en `execute.expert` |
| C-05 | Deslizamiento rápido | soltar en `armado` con movimiento sin `pointermove` | ✅ como mover + soltar |
| C-06 | Modo toque | centro quieto, arrastrar desde una opción | ✅ regla del botón clásico |
| C-07 | Descanso | deriva del pulgar | ✅ se mide desde el inicio del descanso |
| C-08 | Fuera del arco | soltar fuera de 70°–200° | ✅ cancela |
| C-09 | `disabled` | aspecto y efecto no definidos | ✅ atenuada, soltar cancela |
| C-10 | Prioridad | sin posición a 135° con número par | ✅ cercanía + `DESEMPATE` |
| C-11 | API §7 | firmas incompletas | ✅ `FanLayout`, `orderActions`, `assignActions`, `hand` |
| C-12 | Teclado / lector | no estaban en la máquina; `T_INACTIVO` los expulsaba | ✅ `abierto_teclado`, `ACTIVAR`, sin cierre por tiempo |
| C-13 | `onUndo` | el tipo no lo obliga | ✅ `validateScreen` |
| C-14 | Carta | sin acciones | ✅ Compartir, Favorito, Atrás |
| C-15 | Marcar no disponible | ¿negocio o plato? | ✅ plato, en detalle de producto, `MinusCircle` |
| C-16 | Íconos | `Heart` con dos significados; íconos de sección | ✅ `Heart`/`ListHeart`, `IdentificationCard`/`Cube` |
| C-17 | Primeros usos | ¿qué es un uso? | ✅ ejecución |
| C-18 | Orientación | `AnchorPrefs` sin orientación | ✅ solo mano; clave con orientación |
| C-19 | `onSelect` asíncrono | ¿deshacer si falla? | ✅ no; aviso de error |
| C-20 | Documentos 1, 7, 8 | no están en el repo | ✅ manda la lista de §9 |
| C-21 | Deshacer desplaza | ¿qué pasa con la prioridad 1? | ✅ reemplazo temporal |
| C-22 | Solo "Atrás" | con 1 opción iba a la diagonal y rompía D-10 | ✅ "Atrás" siempre a 90° |

---

## 10. Límites de la plataforma web (sobre todo iOS Safari)

| ID | Límite | Consecuencia / mitigación |
|---|---|---|
| **L-01** | iOS Safari no tiene `navigator.vibrate` (ya previsto en D-02). En Chrome Android, vibrar exige activación del usuario, que en táctil llega con el primer `pointerup`. | En el **primer arrastre** de la sesión la preselección no vibra. Aceptable; la señal visual basta. |
| **L-02** | La web **no puede excluir zonas de gestos del sistema** (no hay equivalente a `setSystemGestureExclusionRects`). La barra de inicio de iOS y el "atrás" de Android ganan siempre. | Solo alejarse del borde. ✅ **Decidido:** `MARGEN_LATERAL` 24 px (el ancla en reposo empieza a ~30 px del borde); se confirma en la prueba manual. |
| **L-03** | En Safari (pestaña, no PWA) la barra inferior aparece y desaparece y cambia el alto visible; `safe-area-inset-bottom` puede valer 0 con la barra visible, y la barra flotante de las versiones recientes de iOS puede quedar encima de la esquina. `env()` no se lee desde JS. | Posición recalculada con `visualViewport`; sonda CSS para el área segura; `viewport-fit=cover`. Probar en Safari **y** como "Agregar a inicio". |
| **L-04** | Teclado virtual: no hay API estándar en iOS; `visualViewport` es heurística (falla con zoom). iOS solo muestra el teclado si `focus()` ocurre **dentro** del manejador del gesto. | ✅ **Decidido:** `onSelect` síncrono al soltar, sin esperar la animación. En la demo, el campo de búsqueda debe existir ya en el DOM cuando se llama `focus()` (no montarlo tras la animación). Probar HU-01 en iPhone real. |
| **L-05** | Lupa, selección de texto y menú contextual de iOS al mantener presionado. | Combinación de CSS + `preventDefault` en `touchstart` no pasivo. Solo se verifica a mano (§10.3). |
| **L-06** | `preventDefault` en `pointerdown` **no evita** el `click` posterior: al cerrar el modo toque con un toque fuera, ese click puede llegar al contenido. | El overlay se mantiene hasta el `click` o 350 ms (RF-11). |
| **L-07** | Playwright no es un iPhone: el proyecto "iPhone 14" es WebKit de escritorio en Linux con tamaño y agente de iPhone. No reproduce lupa, gestos del sistema, barra de Safari, teclado ni vibración. `touchscreen` solo tiene `tap()`. Con eventos sintéticos, `setPointerCapture` puede lanzar error y `touch-action` no se ejerce. `page.clock` no controla `event.timeStamp`. | Arrastres por CDP en Chromium y sintéticos en WebKit; `try/catch` en la captura; la máquina usa `performance.now()`. **La prueba manual en iPhone real no es opcional.** |
| **L-08** | 60 fps en gama baja (RNF-03) no se mide de forma fiable en E2E. | Manual: Chrome DevTools con CPU ×4–×6 y, si hay, un Android de gama baja. |
| **L-09** | WSL2 está en modo NAT (IP interna `172.28.23.49`): el celular no ve esa IP. Además, `next dev` abierto por la IP de la LAN no hidrataba en RUTEANDO: el WebSocket `/_next/hmr` fallaba con `ERR_INVALID_HTTP_RESPONSE`. | ✅ **Resuelto en T-12.** (1) Red: `scripts/lan-3002.sh` (`npm run lan`) lee el estado y genera el `.ps1` con `portproxy` + regla de firewall limitada a `LocalSubnet`; lo ejecutas tú como administrador. La IP interna cambia tras `wsl --shutdown` o al reiniciar: se vuelve a correr el script. (2) HMR: **causa confirmada**: Next 16 en desarrollo bloquea `/_next/*` para orígenes que no son `localhost` y, en un WebSocket, responde `Unauthorized` sin línea HTTP, que el navegador reporta como `ERR_INVALID_HTTP_RESPONSE`. Con `allowedDevOrigins: ["192.168.*.*", "10.*.*.*"]` el WebSocket responde `101`; un origen no permitido sigue bloqueado (verificado con curl). |
| **L-10** | `http://192.168.x.x` no es un contexto seguro: no hay `navigator.clipboard` ni `navigator.share`. | Exportar métricas = descargar archivo + texto seleccionable. "Compartir" en la demo es simulado. |
| **L-11** | `screen.orientation` existe en iOS solo desde 16.4. | Respaldo con `matchMedia`. |
| **L-12** | El indicador de Next.js en desarrollo ocupa una esquina inferior, justo donde va el ancla. | `devIndicators: false`, como en RUTEANDO. |
| **L-13** | Con VoiceOver/TalkBack activos, el lector se queda con los deslizamientos. | "Solo deslizar" (D-15) no aplica con lector de pantalla; ahí manda el modo toque (C-12). |
| **L-14** | Playwright en WSL necesita dependencias del sistema para WebKit (`npx playwright install --with-deps`, pide `sudo`). | Lo ejecutarás tú con `! sudo …` en T-14. |
