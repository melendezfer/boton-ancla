# Estado del proyecto — para retomar sin contexto

Última actualización: **26-09-2026**, después de HM-11 (mover el mapa con el ancla, experimental). Los commits de HM-11 (`45d90b2` → este) están **en local, sin subir** hasta que autorices el push.

---

## 0. Retomar mañana

1. **Levanta la demo** (§4) y ábrela en el Nubia (§5). Si cambió la IP del PC o de WSL, vuelve a correr `npm run lan` y los comandos de PowerShell que genera (como administrador, los corres tú).
2. **Prueba HM-10** con `prueba-hm10.md` (listas, las dos variantes) y **HM-11** con `prueba-hm11.md` (mapa). Anota las respuestas de sus §4 y §5.
3. **Abre Claude** y empieza con: *"Lee `CLAUDE.md` y `specs/fase-1/estado.md`. Probé HM-10 y HM-11: prefiero la variante … porque …; para el zoom elijo …"*. Con eso se deja una sola variante de la guía, se decide el zoom y se registra en `spec.md` §12.
4. Cuando puedas, **las sesiones con 3 personas** (§2) para cerrar la Fase 1.

---

## 1. Dónde quedamos

**Bloques A, B, C y D terminados**, salvo la parte humana de T-27. El botón-ancla funciona en la demo, en el PC y en el celular (probado en un Nubia Neo 3 GT: "todo va muy bien; se puede tocar y también arrastrar para seleccionar").

| Bloque | Tareas | Qué hay |
|---|---|---|
| A — Núcleo | T-01 … T-11 ✅ | `packages/core`: TypeScript puro. Geometría, selección, máquina de estados (40 filas), métricas, bienvenida y banda de etiqueta. |
| B — Demo | T-12 … T-14 ✅ | `apps/demo`: Next 16.3.4 en el puerto 3002, pantallas simuladas de RUTEANDO, mapa falso y Playwright. |
| C — Adaptador | T-15 … T-23 ✅ | `packages/react`: el ancla completa (gesto, toque, descanso, deshacer, irreversibles, teclado, mano izquierda, bienvenida). |
| D — Cierre | T-24, T-25, T-26, T-28 ✅ · T-27 ⚠️ | Métricas con exportación, recorrido E2E solo deslizando, contraste y rendimiento medidos, README. Falta la prueba con personas (§2). |

**Pruebas (todas en verde):** 500 del núcleo, 53 de la demo (Vitest) y 287 E2E (Playwright, Pixel 7 + iPhone 14; 7 se saltan a propósito: 6 mediciones opcionales de rendimiento y el control deslizante en WebKit).

**Después del Bloque D** (spec v0.8, §12): HM-03 capas y "Cerrar" ✅, HM-04 teclado por `visualViewport` ✅, HM-05 hojas sobre el teclado ✅, HM-07 reserva del espacio del ancla ✅. **HM-06 + HM-08** ✅ (spec v0.10): cada capa declara ícono, nombre y acciones; el ancla sube sobre el teclado con "Ocultar teclado" a 180°. Guías: `prueba-hm03-hm07.md`, `prueba-hm08.md`. **HM-09** ✅ experimental (spec v0.11, RF-18): el ancla como joystick para desplazar; interruptor en Ajustes (activado en la demo, apagado por defecto en el componente). Guía: `prueba-hm09.md`. **HM-10** ✅ (spec v0.12): la guía al desplazar en dos variantes para comparar, elegibles en Ajustes: **en el ancla** (flecha ↑/↓ y anillo; por defecto) o **arriba** del ancla (cápsula). Ninguna sale de la columna del ancla. Guía: `prueba-hm10.md`. **HM-11** ✅ experimental (spec v0.13, RF-19): en el mapa el joystick es libre en todas las direcciones, con su propio interruptor; la guía de HM-10 con la flecha girada (o un círculo arriba). HU-13 ajustada. Guía: `prueba-hm11.md`.

**Spec:** `spec.md` v0.13. Decisiones clave recientes:
- `ANCLA_ALTURA` = **0,44** (HM-01, dos pruebas manuales).
- Una sola etiqueta en una **banda encima del abanico** (HM-02).
- `AnchorProvider` recibe `icons: { back, undo, close, hideKeyboard, scrollUp?, scrollDown? }`, `desplazar` (HM-09) y `guiaDesplazar` (HM-10).
- Desplazar con el ancla (HM-09, experimental) y su guía en dos variantes (HM-10), a comparar.

**Documentos** (todos en `specs/fase-1/`):
| Archivo | Para qué |
|---|---|
| `spec.md` | Fuente de verdad (qué). Hallazgos de prueba manual en §12. |
| `design.md` | Cómo. §0 = todas las decisiones tomadas. |
| `tasks.md` | Tareas con estado `[x]` / `[ ]`. |
| `decisiones-pendientes.md` | Preguntas abiertas. Hoy: §1 zoom del mapa con una mano (HM-11). |
| `prueba-t12.md` | Red del celular (portproxy) y el hallazgo de Next 16. |
| `prueba-bloque-b.md`, `prueba-bloque-c.md`, `prueba-bloque-d.md` | Guías de prueba manual por bloque. |
| `pruebas-manuales.md` | Registro de sesiones con personas, contraste y rendimiento (T-27). |
| `guion-sesiones.md` | Guion en lenguaje sencillo para las sesiones con 3 personas. |
| `prueba-hm03-hm07.md` | Guía de prueba de los hallazgos HM-03 a HM-07. |
| `prueba-hm08.md` | Guía de prueba de HM-08 (acciones de capa) y HM-06 (ancla sobre el teclado). |
| `prueba-hm09.md` | Guía de prueba de HM-09 (desplazar con el ancla): pasos con el pulgar en carta, Ofertas y Favoritos. |
| `prueba-hm10.md` | Guía de prueba de HM-10: comparar las dos variantes de la guía al desplazar. |
| `prueba-hm11.md` | Guía de prueba de HM-11: mover el mapa con el ancla (joystick libre). |
| `estado.md` | Este archivo. |

---

## 2. Qué sigue

La Fase 1 se cierra con el **criterio de salida** (spec §10): pruebas en verde (✅ hoy), lista manual completa y **3 personas**, una solo deslizando.

| ID | Qué falta | Quién |
|---|---|---|
| **HM-10** | Probar en el Nubia **las dos variantes** de la guía al desplazar (`prueba-hm10.md`) y elegir una. HM-09 sigue experimental hasta entonces. | Usuario, luego juntos |
| **HM-11** | Probar el joystick del mapa (`prueba-hm11.md`), sobre todo que los deslizamientos rápidos no muevan el mapa, y **elegir la opción de zoom** (`decisiones-pendientes.md` §1). | Usuario, luego juntos |
| **T-27** | Sesiones con **3 personas** (una solo deslizando): procedimiento y tabla en `pruebas-manuales.md` §1 y §3. Cada sesión termina exportando el JSON desde Métricas. | Usuario (Claude puede preparar un guion) |
| **T-27** | Medir rendimiento en un **Android de gama baja real** (`pruebas-manuales.md` §5). Hay cuadros sueltos largos con la CPU frenada ×6. | Usuario |
| — | Cuando estén: completar `pruebas-manuales.md`, marcar T-27 `[x]`, registrar hallazgos como HM-xx y decidir si hay Fase 1.1 o se pasa a la Fase 2 (P-01…P-05). | Juntos |

Tareas T-01…T-26 y T-28: hechas (ver `tasks.md`).

## 3. Pendientes y cabos sueltos

**Decisiones pendientes:** **zoom del mapa con una mano** (`decisiones-pendientes.md` §1: A, B recomendada, o C). **HM-10** espera tu comparación en el Nubia para dejar una sola variante. HM-09 y HM-11 siguen experimentales.

**Pruebas E2E con mucha carga:** con 8 navegadores a la vez, el WebKit de prueba dibuja pocos cuadros por segundo y algunas pruebas se vuelven lentas (una de t16 no llegó a cargar el mapa; una de HM-11 falló una vez y no se pudo reproducir en 80 repeticiones). Con la configuración normal la suite pasa entera. Las pruebas de desplazamiento esperan a que el contenido avance, en vez de medir a tiempo fijo.

**Preguntas abiertas para fases siguientes** (spec §11, no bloquean): P-01 descanso + mover (cerrada por HM-09); P-02 teclado (cerrada por HM-06/HM-08); P-03 cambiar de mano rápido; P-04 modos del abanico; P-05 ¿abrir el abanico hacia abajo cuando el ancla está alta?

**Cabos sueltos conocidos:**
- **Remoto:** `origin` = `https://github.com/melendezfer/boton-ancla.git` (corregido por el usuario el 25-09-2026). Push solo con autorización explícita.
- **C-19** (aviso de error cuando una acción asíncrona falla): implementado, pero **sin E2E**, porque ninguna acción de la demo es asíncrona.
- **Interpretación de métricas (C-20)**: "errores" = cancelaciones y bloqueos desde la ejecución anterior; "posición" = altura + lado. A confirmar con el Documento 8 (`prueba-bloque-d.md` §2).
- **Historial y capas (HM-03)**: si una capa se cierra porque se navega desde ella (un enlace dentro de la hoja), queda una entrada duplicada e inofensiva de la misma página en el historial. Un `back()` en ese caso desharía la navegación.
- **Búsqueda de la demo**: es solo visual (no filtra). Se puede agregar si sirve para las sesiones.
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
