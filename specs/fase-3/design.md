# Botón-ancla — Diseño Fase 3: adaptación al espacio

Cómo se construye lo que pide `spec.md` (v0.3). Lo que no se menciona aquí sigue como en `specs/fase-1/design.md`.

---

## 0. Decisiones tomadas

| ID | Decisión | Dónde |
|---|---|---|
| DF3-01 | Entrar a mover: opción `moveAnchor` en el abanico de Ajustes (con espera, como un deslizador) + botón en Ajustes (`startMoveAnchor()`). | §3, §5 |
| DF3-02 | Altura continua en los dos costados; imán al costado más cercano; clic en la altura de inicio. | §4.3 |
| DF3-03 | Cambio de mano = soltar en el otro costado. "Cambiar de mano" en el abanico solo si la prueba manual lo pide. | §4.3 |
| DF3-04 | Sin lugar hacia arriba: bajar el ancla; si no alcanza, abanico hacia abajo y joystick hacia arriba. | §4.4 |
| DF3-05 | `ANCLA_ALTURA_H = 0.30`. | §2 |
| DF3-06 | Zonas evitadas por el ancla, el abanico, la banda y los avisos; se mueve el ancla, nunca las opciones. | §4.2 |
| DF3-07 | Hojas abiertas: como HM-07 (no son zona). | §4.2 |
| DF3-08 | Bienvenida: pregunta la mano deslizando, con botones visibles. | §5.4 |
| DF3-09 | Se mantiene el control deslizante de altura en la demo. | §6 |
| (0.2) | Zonas `obligatoria` / `preferida` (por defecto); mano = costado (H13). | §4.2 |

---

## 1. Arquitectura

Igual que la Fase 1 (D-18): el **núcleo** calcula (puro, sin DOM), el **adaptador** mide y dibuja, la **demo** declara zonas y guarda preferencias.

| Pieza | Nuevo | Qué hace |
|---|---|---|
| `packages/core/src/espacio.ts` | ✅ | Tipos `Zona`, `Colocacion`, `Orientacion`; `huellaAncla`, `posicionesValidas`, `resolverColocacion`, `imanColocacion`. |
| `packages/core/src/layout.ts` | cambia | `computeFanLayout` con `direccion: "arriba" \| "abajo"`; `computeAnchorPosition` recibe la `Colocacion` en vez de `hand` + `ANCLA_ALTURA`. |
| `packages/core/src/machine/*` | cambia | Estado `editando`; `Geometry.abreHacia`; entrada del joystick espejada si el abanico abre hacia abajo. |
| `packages/core/src/metrics.ts` | cambia | `anchor_move`, `anchor_move_cancel`, `hand_change`, `orientation`, `zone_conflict`. |
| `packages/react/src/dom/zonas.ts` | ✅ | Registro de zonas con `ResizeObserver` y recálculo en reposo. |
| `packages/react/src/dom/entorno.ts` | cambia | `useOrientacion()` (vertical / horizontal). |
| `packages/react/src/components/Ancla.tsx` | cambia | Modo edición (bandas válidas, silueta, clic), colocación por orientación, abanico hacia abajo. |
| `packages/react/src/dom/bienvenida.ts` | cambia | Paso "¿Con qué mano?" (H13). |
| `apps/demo` | cambia | Zonas simuladas del mapa, "Mover ancla" en Ajustes, preferencias por orientación, bienvenida con mano. |

---

## 2. Tipos y parámetros (núcleo)

```ts
type Orientacion = "vertical" | "horizontal";
type Lado = "right" | "left";                       // la mano se deduce del lado (H13)
type Colocacion = { lado: Lado; altura: number };   // altura: fracción del alto útil, como ANCLA_ALTURA
type PrefsAncla = { vertical: Colocacion; horizontal?: Colocacion }; // RF3-06; sin horizontal: RF3-08
type Zona = { rect: Rect; prioridad: "obligatoria" | "preferida" };  // en coordenadas de la vista
```

Parámetros nuevos (se agregan a `spec.md` §6 de la Fase 1 y a `DEFAULT_PARAMS`, como siempre): `MARGEN_ZONA = 8`, `ANCLA_ALTURA_H = 0.30`. Se reutilizan `T_ESPERA_DESLIZADOR`, `T_CENTRADO`, `MARGEN_LATERAL`, `MARGEN_INFERIOR`, `UMBRAL_MOV`, `VIB_MS`.

**Compatibilidad:** `AnchorPrefs = { hand }` de la Fase 1 sigue aceptándose: equivale a `{ vertical: { lado: hand, altura: ANCLA_ALTURA } }`. La API nueva es `placement` + `onPlacementChange` en el proveedor (§5.1).

---

## 3. Máquina de estados

Filas nuevas (siguen la numeración de `fase-1/design.md` §3.3):

| # | Estado | Evento | Condición | Nuevo estado | Spec |
|---|---|---|---|---|---|
| 54 | abierto_gesto | TICK / MOVE tardío | `presel` es una opción `moveAnchor` y el pulgar quieto `T_ESPERA_DESLIZADOR` (igual que la fila 47) | `editando {origen, colocacionAntes}` | RF3-01 |
| 55 | reposo | `EDITAR` (botón de Ajustes, `startMoveAnchor()`) | — | `editando` sin dedo: el siguiente `POINTER_DOWN` en el ancla la toma | DF3-01 |
| 56 | editando | POINTER_MOVE | — | editando (actualiza `ultimo`) | RF3-02 |
| 57 | editando | POINTER_UP | — | `soltado {punto}` (transitorio: el adaptador aplica el imán y guarda) | RF3-03 |
| 58 | editando | segundo dedo / ORIENTACION / CAMBIO_SECCION / Escape | — | cancelado (la colocación no cambia) | RF3-04 |

- Soltar sobre "Mover ancla" **sin esperar** ejecuta su `onSelect` (HM-17): en Ajustes, lo mismo que el botón (entra a editar y espera el dedo, fila 55). Así soltar siempre hace algo visible.
- Una pulsación larga sobre el ancla **sigue siendo descanso** (D-12): no hay fila que lleve de `descanso` a `editando`.
- `Geometry.abreHacia: "arriba" | "abajo"` (RF3-15). Con `"abajo"`, `haciaDesplazamiento` usa el arco espejado verticalmente (30°–150°), para que el joystick nunca comparta dirección con el abanico.

---

## 4. Geometría del espacio

### 4.1 Área útil (H11)
`areaUtil = vista − áreas seguras − teclado` (igual que la Fase 1). Las **hojas abiertas no se restan** (DF3-07: como HM-07).

### 4.2 Zonas y huella del ancla (RF3-10, DF3-06)
La **huella** de una colocación es la unión de: el círculo del ancla activa (`D_ACTIVO`), el rectángulo que contiene el abanico **más grande** que puede abrir (`MAX_OPCIONES`, radio adaptativo, opciones escaladas), la **banda** y la **zona de avisos** (`posicionBanda`). Se usa el abanico más grande para que la posición no dependa de la pantalla: las opciones no se mueven al cambiar de sección.

Una colocación es **válida** si su huella, agrandada `MARGEN_ZONA`, no toca ninguna zona que se esté respetando.

### 4.3 Posiciones válidas e imán (RF3-03, DF3-02, DF3-03)
`posicionesValidas(entorno, zonas, prioridades)` devuelve, para cada lado, una lista de **intervalos de altura** (fracciones) donde la colocación es válida. Se calcula muestreando la altura cada 2 px del rango piso–techo y juntando los tramos válidos (barato: se calcula en reposo, no por cuadro; RNF3-01).

`imanColocacion(punto, validas)`: lado = el del costado más cercano a `punto.x`; altura = la del punto, llevada al intervalo válido más cercano de ese lado (si ese lado no tiene ninguno, el otro lado). Cambiar de lado **cambia la mano** (`hand_change`).

**Clic en la altura de inicio (RF3-16):** el adaptador vibra `VIB_MS` y marca la línea cuando la altura arrastrada cruza `ANCLA_ALTURA` (o `ANCLA_ALTURA_H`).

### 4.4 Resolver la colocación guardada (RF3-12, RF3-13, RF3-15)
`resolverColocacion(guardada, entorno, zonas)` → `{ punto, abreHacia, ajustada, conflicto }`, en este orden:
1. La guardada, si es válida respetando **todas** las zonas → esa.
2. Si no: la altura válida más cercana **del mismo lado** respetando todas → `ajustada` (la guardada no se borra).
3. Si no hay ninguna: se repite respetando **solo las obligatorias** (se pueden tapar preferidas) → `conflicto: "preferidas"`.
4. Si el abanico no cabe hacia arriba en ninguna altura (pasa en horizontal con teclado): se prueba con **`abreHacia: "abajo"`** (DF3-04). "Bajar el ancla" ya está incluido en los pasos 1–3: el techo del rango es la altura más alta en la que el abanico cabe hacia arriba.
5. Si no cabe en ninguna dirección: la dirección con más espacio, el abanico con su radio mínimo, y `conflicto: "sin_lugar"` (aviso en la consola de desarrollo y métrica `zone_conflict`).

### 4.5 Orientación (RF3-07…RF3-09)
El adaptador conoce la orientación (`useOrientacion`, el mismo criterio que `useTeclado`: ancho > alto = horizontal; `screen.orientation` o `matchMedia`, L-11). Usa `prefs[orientacion]`; si falta la horizontal, `{ lado: prefs.vertical.lado, altura: ANCLA_ALTURA_H }` (RF3-08). Al cambiar: `ORIENTACION` (cancela, RF-09) y se recoloca sin animación.

---

## 5. Adaptador React

### 5.1 API
```ts
<AnchorProvider
  placement?: PrefsAncla                      // colocación por orientación (reemplaza a prefs.hand)
  onPlacementChange?: (p: PrefsAncla) => void // la app la guarda (la demo, en localStorage)
  …
/>
useAnchorReservedArea(ref | rect, { prioridad?: "obligatoria" | "preferida" }): void;
useAnchorMove(): { mover: () => void; editando: boolean };   // el botón de Ajustes (DF3-01)
AnchorAction.moveAnchor?: true   // la opción "Mover ancla" del abanico
```

### 5.2 Zonas (`dom/zonas.ts`)
Cada `useAnchorReservedArea` registra una zona con un `ResizeObserver` sobre su elemento y escucha `resize`/`scroll` de la vista (las zonas son elementos fijos en pantalla; para elementos que se desplazan con la página, la app pasa un rectángulo). Los cambios suben un contador de versión; el ancla **recalcula solo en reposo** (RF3-11): si llega un cambio durante una interacción, se aplica al volver a reposo.

### 5.3 Modo edición
Mientras `editando`: el ancla sigue al pulgar (sin imán, para que se sienta que se arrastra); se dibujan las **bandas válidas** de ambos costados (líneas translúcidas en los intervalos de §4.3), la **silueta del abanico** (contorno del arco más grande, tenue) y la línea de la altura de inicio. Un velo toma los toques del contenido (como `ESTADOS_CON_VELO`). Al soltar: `imanColocacion`, animación de `T_CENTRADO` (instantánea con movimiento reducido), `onPlacementChange`, métricas.

### 5.4 Bienvenida con mano (H13, DF3-08)
Si no hay colocación guardada y la bienvenida no se hizo: antes de la demostración, el ancla aparece **centrada abajo** con la banda "¿Con qué mano? Desliza hacia ese lado" y dos botones **Derecha / Izquierda**. Deslizar el ancla hacia un costado (o tocar un botón) la deja en ese lado a la altura de inicio. Es el mismo arrastre del modo edición, con los dos costados como únicas posiciones. La bienvenida guarda `manoPreguntada: true`.

---

## 6. Demo

- **Zonas del mapa** (`mapa-falso.tsx`), imitando RUTEANDO (`spec.md` §8): crédito "© OpenStreetMap" abajo a la derecha (**obligatoria**), logo "Ruteando" abajo a la izquierda (preferida) y botones +/− de zoom arriba a la izquierda (preferida; en la demo solo son visuales: el zoom real es el del ancla).
- **Ajustes:** opción "Mover ancla" (`moveAnchor`, prioridad baja) y botón "Mover el ancla"; el control deslizante de altura se mantiene (DF3-09) y ahora ajusta la altura de la orientación actual.
- **Preferencias:** `placement` por orientación en `localStorage` (clave con versión); migración desde `mano` + `anclaAltura`.
- **Bienvenida:** con el paso de la mano; "Repetir la bienvenida" lo incluye.

---

## 7. Pruebas

- **Núcleo (Vitest):** huella y zonas; intervalos válidos con zonas en varias alturas y en los dos lados; imán (lado más cercano, intervalo más cercano, cambio de mano); `resolverColocacion` en sus 5 casos; abanico hacia abajo y joystick espejado; filas 54–58 (y que descanso, joystick y experto no entran a `editando`); métricas; compatibilidad de `{ hand }`.
- **E2E (Pixel 7 e iPhone 14; vertical y horizontal con `page.setViewportSize`):** HU3-01…HU3-13, solo deslizando; el crédito del mapa nunca queda bajo el ancla, el abanico, la banda ni los avisos; girar recuerda la posición de cada orientación.
- **Manual (Nubia):** guía `prueba-fase3-*.md` por bloque.

## 8. Riesgos y límites

- **Horizontal en celular real:** Playwright solo cambia el tamaño de la vista; el giro real (y el teclado en horizontal) lo confirma la prueba manual.
- **iOS:** `screen.orientation` existe desde iOS 16.4; antes se usa `matchMedia("(orientation: …)")` (L-11).
- **Zonas que se desplazan:** un elemento que se mueve con la página no sirve como zona por referencia (su rectángulo cambia al desplazar); la app debe pasar un rectángulo fijo o no declararlo.
- **Rendimiento:** el muestreo de §4.3 es de ~300 alturas × 2 lados × pocas zonas; se hace en reposo y se guarda.
