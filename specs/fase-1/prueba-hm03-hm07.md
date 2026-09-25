# Prueba de HM-03 a HM-07

Qué cambió después de la prueba manual del Bloque D, qué probar en el Nubia y qué queda pendiente. Para levantar la demo y la red, ver `estado.md` §4–§5. **Recarga la página** antes de empezar.

---

## 0. Estado

| Hallazgo | Estado | Commit |
|---|---|---|
| HM-03 — Cerrar lo que se abre encima (capas) | ✅ Hecho | `1376f0e` |
| HM-04 — El ancla no volvía al bajar el teclado con el botón atrás | ✅ Corregido | `4de7146` |
| HM-05 — La búsqueda quedaba detrás del teclado | ✅ Corregido | `ea6fb76` |
| HM-06 — El ancla sube sobre el teclado con "Cerrar" y "Ocultar teclado" | ⏸️ **Esperando una decisión** (§3) | — |
| HM-07 — El ancla tapaba la X de las hojas | ✅ Corregido | `419321a` |

Pruebas: **390** del núcleo, **53** de la demo y **233** E2E, todas en verde; 7 se saltan a propósito.

**Límite importante:** Playwright no puede mostrar el teclado de un celular. HM-04 y HM-05 se probaron con un teclado **simulado**, que reemplaza `visualViewport` como lo reporta Chrome. **La confirmación real es tu prueba en el Nubia** (§1.2 y §1.3).

---

## 1. Qué probar en el Nubia

### 1.1 HM-03 — Capas y "Cerrar"
- [ ] En el **Mapa**, abre **Favoritos** con el ancla. Abre el ancla otra vez: **arriba (90°)** ahora hay una **X "Cerrar"** en lugar de Favoritos; el resto está en el mismo lugar.
- [ ] Desliza a "Cerrar" y suelta: la lista se cierra y sigues en el mapa (HU-14).
- [ ] Abre Favoritos de nuevo y usa el **botón atrás del celular**: se cierra la lista y **no sales del mapa**. Un segundo "atrás" ya navega normal.
- [ ] Lo mismo con **Ofertas cerca** y **Buscar**.
- [ ] En el perfil (rol Dueño), abre "Agregar plato": "Cerrar" aparece **donde estaba "Atrás"**; cerrar no te saca del perfil.
- [ ] Cierra una hoja con **su propia X**: después, el botón atrás del celular debe **navegar a la página anterior** a la primera (no quedar "trabado" una vez).
- [ ] Con una hoja abierta, toca un pin → "Ver perfil" (desde la hoja del pin): debe llevarte al perfil (no volver al mapa).

### 1.2 HM-04 — El ancla vuelve al bajar el teclado
- [ ] Abre **Buscar** con el ancla: sale el teclado y el ancla se **oculta** (RF-13, por ahora; ver HM-06).
- [ ] Baja el teclado con el **botón atrás del celular** (el campo queda enfocado): el ancla **vuelve a aparecer**.

### 1.3 HM-05 — La búsqueda queda sobre el teclado
- [ ] Abre **Buscar**: la hoja sube y queda **encima del teclado**. Escribe "Arepa": **ves lo que escribes**.
- [ ] Baja el teclado: la hoja vuelve al borde de abajo.
- [ ] Gira el celular o cambia de app y vuelve: la hoja no queda en un lugar raro.

### 1.4 HM-07 — La X de las hojas no queda debajo del ancla
- [ ] Abre **Ofertas cerca**: la X del encabezado queda **a la izquierda del ancla**, visible y fácil de tocar. El contenido de la hoja también deja libre la franja del ancla.
- [ ] Repite con **Mano izquierda** (Ajustes): la franja libre pasa al lado izquierdo.
- [ ] En Ajustes, baja la altura del ancla (por ejemplo al 20 %) y abre Ofertas cerca: la X sigue libre.

---

## 2. Tu pregunta: "Arepa" en Buscar no da resultados

**Es solo visual, no es un error.** La spec (§8) pide que "Buscar" abra el campo con el teclado, y eso es lo que hace la demo; nunca se programó una búsqueda que filtre. Si te sirve para las sesiones con personas, puedo agregar resultados simples (negocios y platos de la demo que contengan el texto). Es una tarea chica; dime si la quieres.

---

## 3. Decisión pendiente: HM-06 (el ancla sobre el teclado)

Decidiste que, con el teclado abierto, el ancla **no se oculta**: sube sobre el teclado con "Cerrar" (90°) y "Ocultar teclado". **Falta decidir dónde va "Ocultar teclado".** Cualquier lugar choca con algo ya decidido. El detalle está en `decisiones-pendientes.md`:

- **A (propuesta) — "modo escritura":** con el teclado abierto, el abanico muestra **solo** Cerrar (90°, arriba) y Ocultar teclado (180°, al costado). Muy fácil sin mirar; no choca con Deshacer.
- **B:** "Ocultar teclado" reemplaza a la prioridad 1. Choca con C-21 si hay algo para deshacer al mismo tiempo.
- **C:** "Ocultar teclado" reemplaza a la opción de 180°. Esconde una acción cualquiera de la pantalla.

Con tu respuesta implemento HM-06 (RF-13 pasa de "ocultar" a "subir sobre el teclado"), con sus pruebas.

---

## 4. Qué contarme
1. La decisión de HM-06 (A, B o C).
2. Si §1.2 y §1.3 funcionaron en el Nubia (son los que no puedo verificar con un teclado real).
3. Cualquier punto de §1 que no se comportó como dice.
4. Si quieres la búsqueda con resultados (§2).
