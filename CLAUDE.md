# Botón-ancla — reglas del proyecto

## Fuente de verdad
- `specs/fase-1/spec.md` es la fuente de verdad. Si el código y la spec no coinciden, se corrige uno de los dos **a propósito** y se avisa; nunca en silencio.
- Flujo guiado por especificación: `spec.md` → `design.md` → `tasks.md` → código. No se escribe código de una tarea que no esté en `tasks.md`.
- Las decisiones que la spec no cierra se registran como puntos abiertos (`C-xx` en `design.md`) y se le preguntan al usuario; no se deciden solas.

## Comunicación
- Responde siempre en español. El usuario es junior y está aprendiendo: explica el porqué, no solo el qué.
- Antes de ejecutar cualquier comando, explica en una línea qué hace y por qué lo necesitamos.
- Al terminar cada tarea, resume qué se logró y qué aprendimos.

## Git
- Un commit por tarea terminada, con mensaje en español estilo Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`.
- Nunca hagas `git push` ni reescribas o borres historial (`reset --hard`, `rebase`, `push --force`, `commit --amend` de commits ya hechos) sin preguntar antes.
- El `.gitignore` cubre `node_modules`, `.next`, `coverage`, `.env*`, reportes de Playwright, etc. No se suben secretos.

## Pruebas
- Núcleo (`packages/core`): Vitest en Node, sin DOM.
- E2E (`apps/demo/e2e`): Playwright con emulación táctil (Pixel 7 e iPhone 14).
- **La prueba manual en PC y en celular real es obligatoria**, además de las automáticas. Al cerrar cada tarea con UI, indica cuándo y qué probar a mano (lista de `spec.md` §10.3).

## Demo
- Corre en el puerto **3002** (el 3001 lo usa RUTEANDO): `next dev -H 0.0.0.0 -p 3002`, para abrirla desde el celular en la red local.
- Stack igual que RUTEANDO: Next.js 16.3.4, React 19.2.8, TypeScript 5, Tailwind v4 configurado desde CSS con `@theme inline` (sin `tailwind.config`), íconos de `@phosphor-icons/react/dist/ssr`.
- Gestor de paquetes: npm con workspaces (igual que RUTEANDO).

## Arquitectura (resumen; detalle en `specs/fase-1/design.md`)
- `packages/core`: TypeScript puro. Prohibido importar React o usar `window`/`document` (RNF-07, D-18).
- `packages/react`: adaptador; aquí viven el DOM, los temporizadores, la vibración y los efectos.
- `apps/demo`: pantallas simuladas de RUTEANDO.
