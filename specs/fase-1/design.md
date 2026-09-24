# Botón-ancla — Diseño Fase 1

Deriva de `spec.md` v0.1, que sigue siendo la fuente de verdad. Aquí se decide **cómo** se construye.

**Convención de este documento**
- `§n` = sección de `spec.md`. `HU/RF/RNF/D-xx` = IDs de `spec.md`.
- **C-xx** = contradicción o ambigüedad de la spec (lista en §9). Cuando el diseño necesita una respuesta para avanzar, pone una **Propuesta** marcada con su C-xx. Las propuestas **no se implementan hasta que las apruebes**; si las cambias, se actualizan aquí y en `tasks.md`.
- **L-xx** = límite de la plataforma web (sobre todo iOS Safari), lista en §10.

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
  MARGEN_BORDE: number;    // 16 (se suma el área segura)
  R_MUERTA: number;        // 24
  R_ARCO: number;          // 100 (mínimo; ver radio efectivo en §4, C-01)
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

---

## 4. Geometría

### 4.1 Convención de ángulos
Grados, 0° = derecha, 90° = arriba, 180° = izquierda (eje y hacia arriba, aunque la pantalla lo tenga hacia abajo):
`angulo = atan2(centro.y − p.y, p.x − centro.x)` normalizado a `[0, 360)`.
**Mano izquierda:** todo se calcula en "espacio de mano derecha" reflejando `x` alrededor del centro (`θ' = 180° − θ`). Así el orden relativo al pulgar se conserva (HU-11) y no hay dos implementaciones.

### 4.2 Posición del ancla
```ts
computeAnchorPosition({ viewport, safeArea, hand, params }): Point
// x = right  : viewport.width  − safeArea.right − MARGEN_BORDE − D_ACTIVO/2
//     left   : safeArea.left + MARGEN_BORDE + D_ACTIVO/2
// y = viewport.height − safeArea.bottom − MARGEN_BORDE − D_ACTIVO/2
```
Se usa `D_ACTIVO` (no `D_REPOSO`) para que al crecer no se salga del margen.

### 4.3 Abanico — `computeFanLayout` (firma de §7)
```ts
type Slot = {
  index: number;
  angulo: number;          // grados, ya reflejado según la mano
  punto: Point;            // centro de la opción en pantalla
  sector: { desde: number; hasta: number };  // en espacio de mano derecha, incluye EXT_EXTREMOS
  id?: string;             // lo rellena assignActions
};
computeFanLayout({ anchor, viewport, safeArea, count, hand, params }): Slot[]
```
**Propuesta (C-01):**
- Las opciones se reparten **en los extremos del arco**: con `n` opciones, ángulos `90° + i·90°/(n−1)` (con 1 opción: 135°).
- **Radio efectivo** `R = max(R_ARCO, D_OPCION / (2·sin(Δ/2)))`, con `Δ = 90°/(n−1)`. Da 100 px con 2–4 opciones y 113 px con 5. `R_EXTERIOR = R + 48`.
- Sectores: bisectrices entre ángulos vecinos; el primero empieza en `90° − EXT_EXTREMOS` (70°) y el último termina en `180° + EXT_EXTREMOS` (200°).
- Verificación RF-12: cada opción, con `ESCALA_PRESEL`, debe quedar dentro de `viewport − safeArea − MARGEN_BORDE`. En vertical siempre cabe (ancla a 48 px del borde, alcance máximo ~113+28 px). Si no cabe, la función lo indica (`fueraDePantalla`) en lugar de mover opciones en silencio; los tests lo prueban en 320/375/412/430 px.

### 4.4 Asignación por prioridad — `assignActions` (C-10, C-11)
```ts
orderActions(screen: AnchorScreen): Array<{ id: string; kind: ActionKind; disabled: boolean }>
assignActions(slots: Slot[], ordered): Slot[]   // devuelve slots con id
```
1. Si hay `back`, se agrega la opción fija `id: "atras"` y va **siempre** al slot de 90° (arriba, pegado al borde).
2. El resto se ordena por `priority` (sin prioridad = al final, en orden de declaración).
3. Los slots libres se ordenan por cercanía a 135° (diagonal). Empate (número par de slots): **Propuesta:** gana el más cercano a 180° (más horizontal). Prioridad 1 → slot más cercano, prioridad 2 → siguiente, etc.

Ejemplo, perfil visitante (5): Atrás 90°, Carta 135°, Cómo llegar 157,5°, Favorito 112,5°, Compartir 180°.

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
export function computeFanLayout(...): Slot[];
export function orderActions(...); export function assignActions(...);
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
| Reposo | Fondo `color-mix(in srgb, var(--ba-surface) 60%, transparent)` + `backdrop-filter: blur(12px)` + borde `--ba-border`; ícono de la sección. **Propuesta C-02:** ícono en color `--ba-text` en reposo y `--ba-accent` solo en activo. | D-04, RNF-06 |
| Preselección | Opción a `scale(1.25)`, etiqueta **sobre el punto del dedo** (limitada al viewport), centro con el ícono de la opción, `vibrar(VIB_MS)` si existe `navigator.vibrate`. | RF-06, D-09, D-02 |
| Irreversible | Al preseleccionarla se dibuja el anillo `R_EXTERIOR`; en `confirmacion_armada` se rellena. | RF-07 |
| Ejecutar | `onSelect()` se llama **de forma sincrónica** dentro del manejador de `pointerup`/`click`/`keydown`, antes de `COMPLETADO`. Necesario para que iOS abra el teclado en HU-01 (L-04). Primero se registra `execute` y después se llama `onSelect`, para que un cambio de sección provocado por la acción no se cuente como cancelación. | HU-01, RF-10 |
| Aviso | `AnchorNotice` (`role="status"`, `aria-live="polite"`): deshacer (`T_DESHACER`), "Desliza más allá para confirmar", y "Confirmar" en modo toque. Se ubica encima del ancla, sin taparla. | RF-08, D-14, C-03 |
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
| `/negocio` (visitante) | Perfil de negocio `IdentificationCard` (C-16) | Carta `BookOpen` (1) → `/negocio/carta` · Cómo llegar `NavigationArrow` (2) → aviso simulado · Favorito `Heart` (3) → alterna · Compartir `ShareNetwork` (4) → aviso "Enlace copiado (simulado)" (L-10) · Atrás `ArrowLeft` |
| `/negocio?rol=dueno` | Perfil de negocio | Agregar plato `PlusCircle` (1) → hoja con formulario · Marcar no disponible (2, reversible, ícono por definir C-15) → cambia la insignia + aviso con deshacer · Editar `PencilSimple` (3) → hoja · Atrás |
| `/negocio/carta` | Carta `BookOpen` | **C-14:** Atrás (+ propuesta: Compartir). Lista de productos; tocar uno → `/producto` |
| `/producto?id=` (dueño) | Detalle de producto `Cube` (C-16) | Editar `PencilSimple` (1) · Eliminar `Trash` (2, irreversible) → quita el producto y vuelve a la carta · Atrás |
| `/ajustes` | Ajustes `GearSix` | Atrás. Pantalla: mano derecha/izquierda (HU-11), rol, fondo del mapa, reiniciar bienvenida |
| `/metricas` | Métricas `ChartBar` | Atrás. Lista de eventos, formulario Doc 8 §13 y exportar JSON (§9, RNF-08) |

- **Mapa falso** (`components/fake-map.tsx`): lienzo SVG grande que se arrastra con puntero (`touch-action:none`) con pines de negocios. Sin Leaflet ni teselas externas: la E2E no depende de internet y se prueba HU-13 igual. Fondo seleccionable: *mapa claro*, *foto* (imagen local en `public/`), *oscuro*, para la revisión de legibilidad de §10.3.
- **Hojas inferiores** con `z-[1000]`, como en RUTEANDO, para probar RF-14.
- Barra superior mínima con enlaces a Ajustes y Métricas (fuera del alcance del ancla; HU-09 cubre las acciones del ancla).
- `semantic-icons.ts` de la demo copia el de RUTEANDO y registra los íconos nuevos; registrarlos en RUTEANDO es parte de la integración, no de este repo.

---

## 9. Contradicciones y ambigüedades de la spec

| ID | Tema | Problema | Propuesta |
|---|---|---|---|
| **C-01** | Abanico (§6, D-03) | Con `R_ARCO` 100 px y 90° de arco, 5 opciones de 44 px **se solapan**: entre centros hay 31 px (reparto por sectores) o 39 px (en los extremos). Con 4 opciones por sectores, 39 px. Sin solape hacen falta 113 px (5 en extremos) o 141 px (5 por sectores); con la escala 1,25, 141 y 176 px. | Opciones en los extremos del arco + radio efectivo `max(100, D_OPCION/(2·sin(Δ/2)))` → 113 px con 5, 100 px con ≤4; `R_EXTERIOR` = 161 px. La preseleccionada se solapa un poco con sus vecinas y se dibuja encima. |
| **C-02** | Contraste (D-04, RNF-06) | Con fondo `surface` al 60 %, el ícono `terracota` (#5B3DF5) queda en **2,15:1 sobre contenido negro** y 3,81:1 sobre gris; solo cumple sobre blanco (6,12). "Fondo real" arbitrario (fotos) no se puede garantizar. | Ícono `text` (#1B1B1B) en reposo: 6,05:1 en el peor caso. `terracota` solo en activo (fondo sólido). Se verifica a mano sobre mapa y foto. |
| **C-03** | Deshacer (RF-08 vs D-15/RNF-01/HU-09) | "Deshacer" en el aviso es un **toque**, y todo debe poder hacerse solo deslizando. | Elegir: **(a)** el aviso acepta deslizarlo hacia el lado del pulgar para deshacer, además del toque; **(b)** mientras dura el aviso, el centro del ancla muestra ↺ y "presionar y soltar sin moverse" deshace (pero choca con el modo toque); **(c)** aceptar la excepción. Recomiendo (a). |
| **C-04** | Métrica `open {mode: experto}` (§9) | Al abrir no se sabe si será experto; se sabe al soltar. Tampoco existe el modo teclado. | `open {mode: gesto \| toque \| teclado}`; experto solo en `execute.expert` (experto = soltar menos de `T_ANIM` después de abrir). |
| **C-05** | Deslizamiento rápido | §3 no cubre `armado` + soltar con movimiento ≥ `UMBRAL_MOV` sin `pointermove` intermedio (un deslizamiento rápido puede llegar así). Sin esto, HU-06 falla. | Tratarlo como MOVE + UP (fila 7). |
| **C-06** | `abierto_toque` | No se define: presionar el centro y quedarse quieto (¿descanso?), ni presionar una opción y arrastrar. | Soltar en el centro sin moverse = cancelar a cualquier tiempo; en una opción solo cuenta si se suelta sobre la misma sin moverse; si arrastra desde una opción, no pasa nada. |
| **C-07** | Descanso | El pulgar que descansa se desliza solo unos milímetros; medido desde `inicio`, puede superar 10 px y abrir el menú sin querer. | Medir desde el punto donde empezó el descanso. Revisar con las pruebas si hace falta un umbral mayor en descanso. |
| **C-08** | Soltar fuera del arco | No se define qué pasa si el dedo apunta fuera de 70°–200° (abajo o a la derecha). | Cancelar con motivo `fuera_de_arco`. |
| **C-09** | `disabled` | No se define cómo se ve ni qué pasa al soltar. | Atenuada, se puede preseleccionar (etiqueta "… · no disponible"), soltar = cancelar. Conserva su posición (memoria muscular). |
| **C-10** | Prioridad 1 "en la diagonal" | Con número par de posiciones no hay ninguna a 135°. Tampoco se define el orden del resto. | Por cercanía a 135°; empate → la más horizontal. Validar en pruebas. |
| **C-11** | API §7 | `computeFanLayout` recibe solo `count`, pero "Atrás" debe ir arriba; `resolveSelection` no recibe la mano; `Params`, `Machine`, `Slot`, `Point`, `Rect`, `Insets` no están definidos. | Separar geometría (`computeFanLayout`) de asignación (`assignActions`); añadir `hand` a `resolveSelection`; tipos definidos en §2–§5. |
| **C-12** | Teclado y lectores de pantalla (RNF-05) | La máquina de §3 no tiene teclado. `T_INACTIVO` (4 s) cerraría el menú a quien navega con teclado o lector de pantalla (choca con WCAG 2.2.1). Con VoiceOver/TalkBack el ancla recibe un `click` sin secuencia de puntero. | Estado `abierto_teclado` **sin** cierre por tiempo; evento `ACTIVAR` → `abierto_toque`, también sin cierre por tiempo cuando viene de lector. Flechas: ↑/→ hacia "arriba", ↓/← hacia el extremo lateral, Home/End a los extremos. |
| **C-13** | `onUndo` "obligatorio" | El tipo de §7 no lo obliga. | Mantener el tipo y validarlo con `validateScreen`. Alternativa (cambia la spec): unión discriminada por `kind`. |
| **C-14** | Pantallas de §8 | "Carta" es una sección (HU-10) pero §8 no le da acciones; el detalle de producto solo existe para el dueño. | Carta: Compartir (1) + Atrás. Producto como visitante: fuera de la demo. |
| **C-15** | "Marcar no disponible" | ¿Es el **negocio** ("hoy no estoy vendiendo", contrario a `confirmedSelling`/`SealCheck`) o un **plato**? Cambia el ícono y el texto. `Prohibit` ya se usa en RUTEANDO; hay que revisar su significado. | Decidir entidad e ícono antes de T-24. |
| **C-16** | Íconos (RNF-09) | "Favoritos" (lista, Mapa) y "Favorito" (marcar, Perfil) son dos significados. **RUTEANDO ya usa `Heart` para ambos** (`main-floating-nav.tsx` y `favorite-button.tsx`). Los íconos de sección de Perfil y Producto no pueden ser `Storefront` (= local fijo) ni `Package` (= Combo). | `Heart` = marcar favorito; `ListHeart` = lista de favoritos. Secciones: `IdentificationCard` (perfil) y `Cube` (producto). |
| **C-17** | "Primeros 5 usos" (HU-12) | ¿Uso = ejecutar la opción o también preseleccionarla? | Contar ejecuciones. |
| **C-18** | Preferencias por orientación | §0 dice que la posición se guarda por orientación, pero `AnchorPrefs` solo tiene `hand`. | Fase 1: solo `hand`; la clave de almacenamiento incluye la orientación para no migrar en la Fase 3. |
| **C-19** | `onSelect` asíncrono | Si una acción reversible devuelve una promesa rechazada, ¿se muestra "Deshacer"? | El aviso con deshacer aparece al resolver; si falla, aviso de error y sin deshacer. |
| **C-20** | Documentos 1, 7 y 8 | No están en el repo. No puedo verificar los campos del Doc 8 §13 más allá de la lista de §9. | Usar la lista de §9; si hay más campos, pásame el documento. |

---

## 10. Límites de la plataforma web (sobre todo iOS Safari)

| ID | Límite | Consecuencia / mitigación |
|---|---|---|
| **L-01** | iOS Safari no tiene `navigator.vibrate` (ya previsto en D-02). En Chrome Android, vibrar exige activación del usuario, que en táctil llega con el primer `pointerup`. | En el **primer arrastre** de la sesión la preselección no vibra. Aceptable; la señal visual basta. |
| **L-02** | La web **no puede excluir zonas de gestos del sistema** (no hay equivalente a `setSystemGestureExclusionRects`). La barra de inicio de iOS y el "atrás" de Android ganan siempre. | Solo alejarse del borde. Con `MARGEN_BORDE` 16 px, el ancla en reposo empieza a ~22 px del borde, dentro de la zona de "atrás" de Android (~24 dp por defecto). **Propuesta:** margen lateral 24 px; confirmarlo en la prueba manual. |
| **L-03** | En Safari (pestaña, no PWA) la barra inferior aparece y desaparece y cambia el alto visible; `safe-area-inset-bottom` puede valer 0 con la barra visible, y la barra flotante de las versiones recientes de iOS puede quedar encima de la esquina. `env()` no se lee desde JS. | Posición recalculada con `visualViewport`; sonda CSS para el área segura; `viewport-fit=cover`. Probar en Safari **y** como "Agregar a inicio". |
| **L-04** | Teclado virtual: no hay API estándar en iOS; `visualViewport` es heurística (falla con zoom). iOS solo muestra el teclado si `focus()` ocurre **dentro** del manejador del gesto. | `onSelect` sincrónico; en la demo, el campo de búsqueda debe existir ya en el DOM cuando se llama `focus()` (no montarlo tras la animación). Probar HU-01 en iPhone real. |
| **L-05** | Lupa, selección de texto y menú contextual de iOS al mantener presionado. | Combinación de CSS + `preventDefault` en `touchstart` no pasivo. Solo se verifica a mano (§10.3). |
| **L-06** | `preventDefault` en `pointerdown` **no evita** el `click` posterior: al cerrar el modo toque con un toque fuera, ese click puede llegar al contenido. | El overlay se mantiene hasta el `click` o 350 ms (RF-11). |
| **L-07** | Playwright no es un iPhone: el proyecto "iPhone 14" es WebKit de escritorio en Linux con tamaño y agente de iPhone. No reproduce lupa, gestos del sistema, barra de Safari, teclado ni vibración. `touchscreen` solo tiene `tap()`. Con eventos sintéticos, `setPointerCapture` puede lanzar error y `touch-action` no se ejerce. `page.clock` no controla `event.timeStamp`. | Arrastres por CDP en Chromium y sintéticos en WebKit; `try/catch` en la captura; la máquina usa `performance.now()`. **La prueba manual en iPhone real no es opcional.** |
| **L-08** | 60 fps en gama baja (RNF-03) no se mide de forma fiable en E2E. | Manual: Chrome DevTools con CPU ×4–×6 y, si hay, un Android de gama baja. |
| **L-09** | WSL2 está en modo NAT (IP `172.28.23.49`): `-H 0.0.0.0` no basta para que el celular llegue a la demo. Además, Next 16 en desarrollo bloquea recursos de otro origen si la IP no está en `allowedDevOrigins`. | Modo `networkingMode=mirrored` en `.wslconfig` de Windows, o `netsh interface portproxy` + regla del firewall para el 3002. ¿Cómo lo hiciste con el 3001 de RUTEANDO? |
| **L-10** | `http://192.168.x.x` no es un contexto seguro: no hay `navigator.clipboard` ni `navigator.share`. | Exportar métricas = descargar archivo + texto seleccionable. "Compartir" en la demo es simulado. |
| **L-11** | `screen.orientation` existe en iOS solo desde 16.4. | Respaldo con `matchMedia`. |
| **L-12** | El indicador de Next.js en desarrollo ocupa una esquina inferior, justo donde va el ancla. | `devIndicators: false`, como en RUTEANDO. |
| **L-13** | Con VoiceOver/TalkBack activos, el lector se queda con los deslizamientos. | "Solo deslizar" (D-15) no aplica con lector de pantalla; ahí manda el modo toque (C-12). |
| **L-14** | Playwright en WSL necesita dependencias del sistema para WebKit (`npx playwright install --with-deps`, pide `sudo`). | Lo ejecutarás tú con `! sudo …` en T-14. |
