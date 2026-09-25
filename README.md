# Botón-ancla

Un botón flotante que abre un **abanico de acciones con un solo gesto del pulgar**: presionar, deslizar hacia la opción y soltar. Está pensado para usar el celular con una mano. También se puede tocar, usar solo deslizando o manejar con teclado. Primera app base: **RUTEANDO**.

La especificación manda: [`specs/fase-1/spec.md`](specs/fase-1/spec.md). Si el código y la spec no coinciden, se corrige uno de los dos a propósito, nunca en silencio.

## Qué hay en el repositorio

```
packages/core    @boton-ancla/core   TypeScript puro (sin React ni DOM): geometría, selección,
                                     máquina de estados, métricas, bienvenida. Se prueba en Node.
packages/react   @boton-ancla/react  Adaptador React: AnchorProvider, useAnchorScreen, eventos,
                                     animaciones y estilos (anchor.css, sin colores propios).
apps/demo        demo                Next.js 16 con pantallas simuladas de RUTEANDO (puerto 3002).
scripts/         lan-3002.sh         Ayuda para abrir la demo desde el celular (WSL2).
specs/fase-1/    spec, diseño, tareas, estado y guías de prueba.
```

## Requisitos
- Node.js **≥ 22.12** y npm.
- Para las pruebas E2E: navegadores de Playwright (`npx playwright install chromium webkit`) y, en Linux/WSL, sus librerías (`sudo npx playwright install-deps chromium webkit`, desde `apps/demo`).

## Empezar

```bash
npm install
npm run dev          # demo en http://localhost:3002 (y en la red local)
```

Abrir desde el celular (WSL2 en modo NAT): ver [`specs/fase-1/estado.md`](specs/fase-1/estado.md) §5. En resumen, `npm run lan` revisa y genera los comandos de Windows (portproxy + firewall) para ejecutarlos como administrador.

## Pruebas

| Comando | Qué corre |
|---|---|
| `npm test` | Vitest: núcleo (380) y demo (53: registro de íconos, pantallas, exportación, contraste). |
| `npm run typecheck` | TypeScript en los tres paquetes. |
| `npm run e2e` | Playwright, Pixel 7 (Chromium, toques reales) e iPhone 14 (WebKit): 193 pruebas. |
| `npm run lint -w demo` | ESLint de la demo. |
| `npm run e2e:rendimiento -w demo` | Medición opcional de cuadros con la CPU frenada (RNF-03). |

La tabla que une cada historia de usuario con sus pruebas está en [`apps/demo/e2e/README.md`](apps/demo/e2e/README.md). La **prueba manual en un celular real es obligatoria**: [`specs/fase-1/pruebas-manuales.md`](specs/fase-1/pruebas-manuales.md).

## Usar el componente en una app React

```tsx
import { AnchorProvider, useAnchorScreen } from "@boton-ancla/react";
import "@boton-ancla/react/anchor.css";

// Una vez, arriba de todo:
<AnchorProvider
  prefs={{ hand: "right" }}
  theme={{ accent: "var(--color-terracota)", surface: "var(--color-surface)", border: "var(--color-border)",
           text: "var(--color-text)", textMuted: "var(--color-text-muted)", zIndex: 1100 }}
  icons={{ back: ArrowLeft, undo: ArrowCounterClockwise }}
  onEvent={(m) => guardarMetrica(m)}
>
  <App />
</AnchorProvider>

// En cada sección:
useAnchorScreen({
  id: "mapa",
  sectionIcon: MapTrifold,
  sectionLabel: "Mapa",
  actions: [
    { id: "buscar", label: "Buscar", icon: MagnifyingGlass, priority: 1, onSelect: abrirBusqueda },
    { id: "eliminar", label: "Eliminar", icon: Trash, kind: "irreversible", onSelect: eliminar },
  ],
});
```
Máximo 5 opciones por pantalla, contando "Atrás" (`back`). Las reversibles necesitan `onUndo`. El contrato completo está en spec §7 y en `design.md` §5.

## Documentos (`specs/fase-1/`)

| Archivo | Para qué |
|---|---|
| `spec.md` | Qué hace (fuente de verdad); §12 = hallazgos de prueba manual. |
| `design.md` | Cómo está hecho; §0 = todas las decisiones tomadas. |
| `tasks.md` | Tareas y su estado. |
| `estado.md` | Dónde quedamos y cómo retomar. |
| `decisiones-pendientes.md` | Preguntas abiertas que esperan decisión. |
| `pruebas-manuales.md` | Prueba manual, contraste y rendimiento. |
| `prueba-*.md` | Guías de prueba por bloque. |
