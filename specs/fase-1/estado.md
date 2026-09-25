# Estado del proyecto — para retomar sin contexto

Última actualización: **25-09-2026**, al cerrar el Bloque D.
Si retomas con Claude, empieza con: *"Lee `CLAUDE.md` y `specs/fase-1/estado.md`"* y dile qué resultados trajiste de las sesiones de prueba (§2).

---

## 1. Dónde quedamos

**Bloques A, B, C y D terminados**, salvo la parte humana de T-27. El botón-ancla funciona en la demo, en el PC y en el celular (probado en un Nubia Neo 3 GT: "todo va muy bien; se puede tocar y también arrastrar para seleccionar").

| Bloque | Tareas | Qué hay |
|---|---|---|
| A — Núcleo | T-01 … T-11 ✅ | `packages/core`: TypeScript puro. Geometría, selección, máquina de estados (40 filas), métricas, bienvenida y banda de etiqueta. |
| B — Demo | T-12 … T-14 ✅ | `apps/demo`: Next 16.3.4 en el puerto 3002, pantallas simuladas de RUTEANDO, mapa falso y Playwright. |
| C — Adaptador | T-15 … T-23 ✅ | `packages/react`: el ancla completa (gesto, toque, descanso, deshacer, irreversibles, teclado, mano izquierda, bienvenida). |
| D — Cierre | T-24, T-25, T-26, T-28 ✅ · T-27 ⚠️ | Métricas con exportación, recorrido E2E solo deslizando, contraste y rendimiento medidos, README. Falta la prueba con personas (§2). |

**Pruebas (todas en verde):** 380 del núcleo, 53 de la demo (Vitest) y 193 E2E (Playwright, Pixel 7 + iPhone 14; 7 se saltan a propósito: 6 mediciones opcionales de rendimiento y el control deslizante en WebKit).

**Spec:** `spec.md` v0.7. Decisiones clave recientes:
- `ANCLA_ALTURA` = **0,44** (HM-01, dos pruebas manuales).
- Una sola etiqueta en una **banda encima del abanico** (HM-02).
- `AnchorProvider` recibe `icons: { back, undo }`.

**Documentos** (todos en `specs/fase-1/`):
| Archivo | Para qué |
|---|---|
| `spec.md` | Fuente de verdad (qué). Hallazgos de prueba manual en §12. |
| `design.md` | Cómo. §0 = todas las decisiones tomadas. |
| `tasks.md` | Tareas con estado `[x]` / `[ ]`. |
| `decisiones-pendientes.md` | Vacío hoy. Aquí van las preguntas nuevas. |
| `prueba-t12.md` | Red del celular (portproxy) y el hallazgo de Next 16. |
| `prueba-bloque-b.md`, `prueba-bloque-c.md`, `prueba-bloque-d.md` | Guías de prueba manual por bloque. |
| `pruebas-manuales.md` | Registro de sesiones con personas, contraste y rendimiento (T-27). |
| `estado.md` | Este archivo. |

---

## 2. Qué sigue

La Fase 1 se cierra con el **criterio de salida** (spec §10): pruebas en verde (✅ hoy), lista manual completa y **3 personas**, una solo deslizando.

| ID | Qué falta | Quién |
|---|---|---|
| **T-27** | Sesiones con **3 personas** (una solo deslizando): procedimiento y tabla en `pruebas-manuales.md` §1 y §3. Cada sesión termina exportando el JSON desde Métricas. | Usuario (Claude puede preparar un guion) |
| **T-27** | Medir rendimiento en un **Android de gama baja real** (`pruebas-manuales.md` §5). Hay cuadros sueltos largos con la CPU frenada ×6. | Usuario |
| — | Cuando estén: completar `pruebas-manuales.md`, marcar T-27 `[x]`, registrar hallazgos como HM-xx y decidir si hay Fase 1.1 o se pasa a la Fase 2 (P-01…P-05). | Juntos |

Tareas T-01…T-26 y T-28: hechas (ver `tasks.md`).

## 3. Pendientes y cabos sueltos

**Decisiones pendientes:** ninguna abierta (`decisiones-pendientes.md` está vacío).

**Preguntas abiertas para fases siguientes** (spec §11, no bloquean): P-01 descanso + mover; P-02 teclado (hoy se oculta); P-03 cambiar de mano rápido; P-04 modos del abanico; P-05 ¿abrir el abanico hacia abajo cuando el ancla está alta?

**Cabos sueltos conocidos:**
- **Remoto:** `origin` = `https://github.com/melendezfer/boton-ancla.git` (corregido por el usuario el 25-09-2026). Push solo con autorización explícita.
- **C-19** (aviso de error cuando una acción asíncrona falla): implementado, pero **sin E2E**, porque ninguna acción de la demo es asíncrona.
- **Interpretación de métricas (C-20)**: "errores" = cancelaciones y bloqueos desde la ejecución anterior; "posición" = altura + lado. A confirmar con el Documento 8 (`prueba-bloque-d.md` §2).
- **Rendimiento**: con la CPU frenada ×6 quedan cuadros sueltos de 100–170 ms, probablemente al abrir el menú. Si se confirma en un celular real, la idea es montar el abanico de antemano, oculto.
- **Historial**: el commit `f999b4d` quedó con una E2E en rojo (una carrera con la hidratación); se corrigió en `7e5859f`. Desde ahí, el commit se hace solo si las pruebas pasan.
- En RUTEANDO: el "Cargando…" desde el celular con `next dev` se arreglaría con `allowedDevOrigins` (explicado en `prueba-t12.md` §2). **No se tocó RUTEANDO.**

---

## 4. Cómo levantar la demo

Todo en una terminal de **WSL (Ubuntu)**.

```bash
cd ~/boton-ancla
npm install            # solo si cambió package.json o es un equipo nuevo
npm run dev            # next dev -H 0.0.0.0 -p 3002; esperar "✓ Ready in …"
```
- PC: `http://localhost:3002` (redirige a `/mapa`).
- Apagar: **Ctrl + C** en esa terminal.

Otros comandos útiles (desde `~/boton-ancla`):
| Comando | Qué hace |
|---|---|
| `npm test` | Vitest del núcleo y de la demo. |
| `npm run typecheck` | Revisa los tipos de todos los paquetes. |
| `npm run e2e` | Playwright (reutiliza la demo si ya está corriendo). |
| `npm run lint -w demo` | ESLint de la demo. |
| `npm run e2e:rendimiento -w demo` | Medición opcional de cuadros con la CPU frenada (Chromium). |

Si Playwright dice que faltan librerías (pasa en un equipo nuevo): `cd apps/demo && sudo npx playwright install-deps chromium webkit` (pide tu contraseña).

---

## 5. Cómo abrir la demo en el celular (red)

**Por qué hace falta algo extra:** WSL2 corre en modo NAT. Linux tiene una IP interna (hoy `172.28.23.49`) que el celular no ve; el celular ve la IP de Windows en el Wi-Fi (hoy `192.168.1.7`). Windows reenvía el puerto 3002 hacia WSL (`portproxy`) y el firewall deja entrar la conexión. Detalle completo en `prueba-t12.md` §3.

1. Con la demo corriendo, en WSL:
   ```bash
   npm run lan
   ```
   Solo lee la configuración de Windows. Si dice **"Listo, no hay que hacer nada en Windows"**, salta al paso 3.
2. Si falta algo, el script genera `C:\Users\USUARIO\boton-ancla-lan-3002.ps1` con la IP actual. Abre **PowerShell como administrador** y ejecuta:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\USUARIO\boton-ancla-lan-3002.ps1"
   ```
   Vuelve a correr `npm run lan` para confirmar.
3. En el celular, **en el mismo Wi-Fi**: `http://192.168.1.7:3002`. Usa la IP que muestre `npm run lan` si cambió.

**Cuándo repetir el paso 2:** la IP interna de WSL cambia al reiniciar Windows o hacer `wsl --shutdown`.

`next dev` ya carga bien por la IP de la red gracias a `allowedDevOrigins` en `apps/demo/next.config.ts` (hallazgo de T-12). No hace falta `next start`.

---

## 6. Reglas del proyecto (resumen de `CLAUDE.md`)
- Todo en español; explicar cada comando antes de ejecutarlo; resumir al final de cada tarea.
- Un commit por tarea (Conventional Commits en español). **Nunca `git push` sin autorización explícita.**
- Toda decisión se registra a la vez en `spec.md` y `design.md`; lo que no está decidido va a `decisiones-pendientes.md`.
- La prueba manual en PC y celular es obligatoria además de las automáticas.
