# Decisiones pendientes — Fase 1

Puntos que necesitan tu decisión. Al decidirlos pasan a `design.md` §0 y a `spec.md`, y se borran de aquí.

---

## HM-09 · Desplazar con el ancla (tipo joystick) — espera tu visto bueno

Tu propuesta está registrada en `spec.md` §12. Aquí: choques revisados, cambios en la máquina de estados y parámetros propuestos.

### 1. Choques con decisiones anteriores

| Decisión | ¿Choca? | Cómo lo propongo |
|---|---|---|
| **D-11 descanso** (quieto 400 ms = descanso; "descanso + mover" abre el menú) | Se complementan; cierra **P-01** | Desde el descanso también decide la primera dirección: hacia el arco → menú (como hoy); hacia abajo → desplazamiento. Así, leer con el pulgar apoyado y "empujar" hacia abajo desplaza sin abrir nada. |
| **C-05** (deslizamiento relámpago sin `pointermove`) | No | Si se suelta antes de entrar al modo, no hay nada que desplazar: un relámpago hacia abajo sigue siendo "fuera del arco → cancelar". |
| **Modo experto** (D-08) | Riesgo leve | Un relámpago impreciso hacia "izquierda-abajo" podría caer en la zona de desplazamiento. Las zonas no se tocan: el arco del menú llega hasta 200° (incluida la tolerancia `EXT_EXTREMOS`) y la de desplazamiento empieza **después** (propuesta: 210°–330°, con 10° de margen a cada lado). |
| **HU-13** (presionar el ancla y deslizar **no** mueve el mapa) | ⚠️ **Sí, si el mapa fuera el "contenedor principal"** | El modo desplazamiento **solo existe si hay un objetivo registrado** (`useAnchorScroll`) o una capa con contenido que se desplaza. El mapa **no** se registra: en el mapa, hacia abajo sigue siendo "fuera del arco", como hoy. |
| **HM-08** (capas) | No | Objetivo = el contenedor que registre la capa de arriba (`useAnchorLayer(..., { scrollRef })`); si no hay, el de la pantalla (`useAnchorScroll(ref)`). |
| **Teclado abierto** (HM-06, RF-17) | No | Con el ancla sobre el teclado, hay poco espacio hacia abajo: la zona del joystick se mide **desde el punto donde empezó el modo** y se recorta a lo visible (el dedo no necesita entrar en el teclado). "Ocultar teclado" (180°) queda en el arco, fuera de la zona de desplazamiento. |
| **RF-11 / velo** | No | El desplazamiento es con el dedo apoyado desde el ancla: no hay velo, y el puntero está capturado por el ancla (no llega al contenido). |

### 2. Qué cambia en la máquina de estados (resumen)
1. **Estado nuevo `desplazando`** `{ pointerId, origen, t0, ultimo }`, bloqueado hasta soltar.
2. **Entrada:** desde `armado` o `descanso`, el primer `POINTER_MOVE` que supera `UMBRAL_MOV`, si su ángulo cae en `ARCO_DESPLAZAR` **y** `geo.desplazable` → `desplazando`. Si no, igual que hoy (`abierto_gesto`).
3. **Dentro:** `POINTER_MOVE` solo actualiza `ultimo`. La velocidad la calcula una función pura `velocidadDesplazamiento(dy, params)` (zona muerta, curva, tope) y la aplica el adaptador cuadro a cuadro.
4. **Salida:** `POINTER_UP` → `reposo` (se detiene en seco, sin inercia). Segundo dedo, `pointercancel`, orientación o cambio de sección → `cancelado`, como hoy.
5. **`Geometry`** suma `desplazable: boolean`. Las métricas suman `scroll_start` y `scroll_end {ms, px}`.
6. **Nada más cambia:** menú, modo toque, teclado, irreversibles y capas siguen igual.

### 3. Parámetros propuestos (ajustables en la prueba manual)
| Parámetro | Valor inicial | Qué es |
|---|---|---|
| `ARCO_DESPLAZAR` | 210°–330° (mano derecha; espejo en la izquierda) | Direcciones que activan el modo |
| `R_MUERTA_DESPLAZAR` | 8 px | Zona muerta vertical alrededor del punto de inicio |
| `R_MAX_DESPLAZAR` | 72 px | Borde de la zona: ahí se alcanza la velocidad máxima |
| `V_MAX_DESPLAZAR` | 1400 px/s | Velocidad máxima |
| `CURVA_DESPLAZAR` | 2,2 | Exponente de la curva (más alto = más lento cerca del centro, para leer) |
| `V_MAX_REDUCIDO` | 500 px/s | Velocidad máxima con `prefers-reduced-motion` |

### 4. Cosas que conviene que decidas o confirmes
- **Horizontal:** ¿solo vertical, o también desplazamiento lateral? Propuesta: **solo vertical** en esta fase.
- **Guía visual:** una franja translúcida vertical del lado del contenido (fuera del ancla, sin tapar el texto central), con ↑ ↓ y un punto que sigue al dedo. ¿Te parece?
- **Interruptor:** "Desplazar con el ancla" en Ajustes, activado por defecto en la demo; en el componente, una prop del proveedor (`desplazar: true | false`, por defecto `false` fuera de la demo por ser experimental). ¿OK?
- **Demo:** ¿qué pantallas se registran para probarlo? Propuesta: el **perfil** (texto largo), la **carta** y las hojas con lista (**Ofertas cerca**, **Favoritos**). El mapa **no** (HU-13).
