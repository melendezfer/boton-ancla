# Decisiones pendientes — Fase 1

Puntos de la spec que necesitan tu decisión, explicados con calma. Cada uno trae el problema, un ejemplo concreto, las opciones y mi propuesta.
Para responder basta con el ID: "C-05 ok", "C-06 opción B", etc. Al decidir, el punto pasa a `design.md` §0 y se borra de aquí.

---

## C-05 · Un deslizamiento muy rápido que llega "de golpe"

**Qué tareas bloquea:** T-06 (máquina de gesto) y, por ende, HU-06 (modo experto).

### El problema
La máquina de §3 decide que hubo **gesto** cuando llega un evento `pointermove` y el dedo ya se movió más de `UMBRAL_MOV` (10 px). Solo después, estando en `abierto_gesto`, un `pointerup` ejecuta la opción.

Pero el navegador **no garantiza** que llegue un `pointermove` antes del `pointerup`. Los movimientos se agrupan y se entregan como mucho una vez por cuadro de pantalla (cada ~16 ms a 60 Hz). En un deslizamiento experto muy rápido puede pasar esto:

```
t = 0 ms    pointerdown  en (300, 700)         → armado
t = 12 ms   pointerup    en (230, 630)         → ¿?
            (nunca llegó un pointermove en medio)
```

El dedo recorrió ~99 px hacia arriba y a la izquierda, justo en dirección a "Buscar". Pero §3 solo dice qué pasa si se suelta en `armado` **con movimiento menor a 10 px** (toque o nada). No dice qué hacer si se suelta en `armado` **con movimiento mayor**. Si no lo definimos, el código haría una de dos cosas malas:
- ignorarlo (volver a reposo): la persona experta "no le atinó" sin razón, justo en el caso que HU-06 promete que funciona;
- tratarlo como toque: abriría el menú en modo toque, cosa que la persona no pidió.

Es más probable en teléfonos lentos o cargados, que son justo los de gama baja que queremos cuidar (RNF-03).

### Opciones
- **A (propuesta):** si en `armado` llega `pointerup` y el dedo se movió ≥ `UMBRAL_MOV`, la máquina se comporta **como si hubiera llegado un `pointermove` a ese punto y luego el `pointerup`**. Pasa por `abierto_gesto` sin detenerse y aplica las reglas normales de soltar: zona muerta → cancelar; sector normal → ejecutar; irreversible → bloqueado; etc. Se registra como `execute` con `expert: true`.
- **B:** ignorar esos casos (volver a reposo sin efecto). Más simple, pero rompe HU-06 justo cuando la persona es más rápida.
- **C:** en el adaptador, leer `getCoalescedEvents()` para reconstruir los movimientos intermedios. No resuelve el caso: si no hubo ningún evento de movimiento, no hay nada que reconstruir.

### Mi propuesta
**A.** Es la interpretación más fiel a D-08 ("soltar fuera de la zona muerta ejecuta según la dirección, sin esperar la animación"): lo que importa es **dónde se soltó**, no cuántos eventos llegaron en medio. Se agrega como la fila 7 de la tabla de transiciones y se prueba en Vitest con un `pointerdown` seguido directamente de un `pointerup` lejano.

---

## C-06 · Qué pasa con cada toque cuando el menú está abierto en modo toque

**Qué tareas bloquea:** T-08 (máquina, modo toque) y T-18 (UI del modo toque).

### El problema
En `abierto_toque` (el menú quedó abierto tras un toque rápido), la spec define estos casos:
- tocar una opción → se ejecuta;
- presionar el centro **y deslizar** → pasa a modo gesto;
- tocar el centro, tocar fuera o esperar 4 s → se cierra.

Pero hay situaciones reales que no cubre:

1. **Presionar el centro y quedarse quieto.** En `reposo`, dejar el pulgar quieto 400 ms es "descanso" y no hace nada. ¿Aquí también? Y al soltar después de 2 segundos, ¿es un "toque en el centro" (cerrar) o no?
2. **Presionar una opción y arrastrar el dedo.** Por ejemplo, la persona apoya el dedo sobre "Favorito", duda y lo arrastra hacia "Compartir". ¿Se ejecuta Favorito, Compartir o nada?
3. **Presionar una opción y soltar en otra.** Parecido al anterior, pero sin importar cuánto se movió.
4. **Presionar una opción y mantener.** ¿Cuenta como toque si pasan 2 segundos?

Esto importa porque un error aquí ejecuta acciones que la persona **no quiso**. Con "Eliminar" (irreversible) hay confirmación, pero "Marcar no disponible" (reversible) se aplica de inmediato.

### Opciones
- **A (propuesta), la regla del botón clásico:** una opción se ejecuta solo si el dedo **baja y sube sobre la misma opción** moviéndose menos de `UMBRAL_MOV`, sin límite de tiempo. Es como funcionan los botones en iOS y Android: si arrastras el dedo fuera del botón antes de soltar, no se activa.
  - Caso 1: presionar el centro y soltar sin moverse (a cualquier tiempo) **cierra** el menú. No hay "descanso" dentro del modo toque, porque el menú ya está abierto y lo esperable es que tocar el ancla lo cierre.
  - Casos 2 y 3: si el dedo se movió más de 10 px o se soltó sobre otra opción, **no pasa nada** y el menú sigue abierto (el tiempo de inactividad se reinicia).
  - Caso 4: mantener y soltar sin moverse **sí ejecuta**. Mientras el dedo está apoyado, el cierre por inactividad se pausa.
- **B:** presionar una opción y arrastrar **convierte la interacción en gesto**: la preselección sigue al dedo y al soltar se ejecuta lo que esté debajo, como en `abierto_gesto`. Es más "fluido", pero el gesto empezaría desde una opción y no desde el centro, así que los ángulos ya no significan lo mismo y la regla de "volver al centro para cancelar" se vuelve confusa.
- **C:** tratar el caso 1 igual que en reposo (quieto 400 ms = descanso). Agrega un estado más y es difícil de descubrir con el menú abierto.

### Mi propuesta
**A.** Es lo que la gente ya conoce de cualquier botón y es la que menos ejecuciones accidentales produce. Además no rompe D-15 ("solo deslizando"): quien no puede tocar sigue teniendo el camino de presionar el centro y deslizar (fila 25).

---

## C-10 · Dónde va cada opción según su prioridad

**Qué tareas bloquea:** T-04 (asignación de posiciones) y todo lo visual que viene después.

### El problema
La spec dice: "La prioridad 1 va en la **diagonal**, que es la posición más cómoda. Si la app habilita 'Atrás', ocupa siempre el extremo 'arriba'". Con la decisión de C-01, las opciones se reparten **desde los extremos** del arco de 90° a 180°:

| Nº de opciones | Ángulos de las posiciones |
|---|---|
| 1 | 135° |
| 2 | 90°, 180° |
| 3 | 90°, 135°, 180° |
| 4 | 90°, 120°, 150°, 180° |
| 5 | 90°, 112,5°, 135°, 157,5°, 180° |

(90° = recto hacia arriba desde el ancla; 180° = recto hacia la izquierda; 135° = la diagonal, con la mano derecha.)

Faltan tres cosas:
1. **Con 2 o 4 posiciones no hay ninguna a 135°.** Con 4 (la pantalla Mapa), las más cercanas son 120° y 150°, empatadas a 15°. ¿Cuál es "la diagonal"?
2. **La spec no dice dónde van las prioridades 2, 3 y 4.** ¿Se alejan de la diagonal alternando lados? ¿Van en orden de arriba hacia la izquierda?
3. **Con 2 posiciones y sin "Atrás"**, las dos quedan en los extremos (90° y 180°) y ninguna en la diagonal.

### Opciones
- **A (propuesta), cercanía a la diagonal con desempate hacia la horizontal:** las posiciones libres se ordenan de la más cercana a 135° a la más lejana; la prioridad 1 toma la primera, la 2 la segunda, etc. Si dos posiciones empatan, gana la **más horizontal** (la más cercana a 180°). Para el pulgar derecho apoyado abajo a la derecha, estirarse hacia la izquierda suele costar menos que hacia arriba, pero eso **se valida en la prueba manual**. "Atrás" se coloca antes que todo en 90°.
  - Mapa (4, sin Atrás): Buscar 150°, Mi ubicación 120°, Ofertas cerca 180°, Favoritos 90°.
  - Perfil visitante (4 + Atrás): Atrás 90°, Carta 135°, Cómo llegar 157,5°, Favorito 112,5°, Compartir 180°.
  - Producto dueño (2 + Atrás): Atrás 90°, Editar 135°, Eliminar 180°.
- **B, igual pero con desempate hacia arriba** (gana la más cercana a 90°). Mapa: Buscar 120°, Mi ubicación 150°…
- **C, orden de lectura:** prioridad 1 en la diagonal y el resto en orden fijo de arriba hacia la izquierda. Más fácil de explicar, pero la prioridad 2 puede quedar lejísimos de la diagonal.
- **D, con 2 o 4 opciones, cambiar el reparto** para que siempre haya una posición a 135° (por ejemplo, 4 opciones en 90°, 135°, 157,5° y 180°). La diagonal existe siempre, pero el espacio entre opciones deja de ser igual y las opciones de arriba quedan más apretadas.

### Mi propuesta
**A**, con el sentido del desempate como **parámetro** (`DESEMPATE: "horizontal" | "vertical"`, por defecto `"horizontal"`), para cambiarlo en la prueba manual sin tocar código, igual que el radio. Con la mano izquierda todo se refleja, así que "horizontal" significa hacia la derecha.

---

## C-21 · "Deshacer" en la posición de prioridad 1: ¿qué pasa con la acción que estaba ahí? *(nuevo, sale de tu decisión de C-03)*

**Qué tareas bloquea:** T-19 (acciones sensibles).

### El problema
Decidiste que, mientras el aviso de deshacer está visible, "Deshacer" ocupa la posición de prioridad 1. Pero esa posición ya tiene dueña. Ejemplo, perfil del dueño:

| Posición | Normal | Durante el aviso |
|---|---|---|
| 90° | Atrás | Atrás |
| 135° (prioridad 1) | Agregar plato | **Deshacer** |
| 157,5° / 112,5° / 180° | Marcar no disponible, Editar, … | ¿? |

Y el máximo sigue siendo 5 posiciones.

### Opciones
- **A (propuesta), reemplazo temporal:** "Deshacer" toma el lugar de la prioridad 1 y **nada más se mueve**. La acción de prioridad 1 queda oculta como mucho 5 s. Se conserva la memoria muscular de todas las demás posiciones; el costo es no poder usar la acción de prioridad 1 durante esos segundos. Como el total no cambia, nunca se pasa de 5.
- **B, corrimiento:** todas bajan una prioridad y la última se oculta si no cabe. Nada se pierde "del todo", pero **todas** las posiciones se mueven por 5 s. Eso choca con el modo experto (D-08): quien desliza sin mirar ejecutaría otra cosa.

### Preguntas relacionadas
- **Si la persona cambia de sección con el aviso visible:** propongo que el aviso y "Deshacer" sigan hasta que venzan los 5 s, porque la acción ya aplicada se puede revertir desde cualquier lugar.
- **Ícono:** propongo `ArrowCounterClockwise`, registrado en `semantic-icons.ts` de la demo.

### Mi propuesta
**A**, más las dos respuestas de arriba.

---

## Otros puntos todavía abiertos (resumen, detalle en `design.md` §9)

| ID | Pregunta corta | Bloquea |
|---|---|---|
| C-12 | Teclado y lector de pantalla: estado `abierto_teclado` sin cierre por tiempo. ¿Ok? | T-09, T-21 |
| C-14 | Acciones de la sección "Carta" (propuesta: Compartir + Atrás). | T-13, T-24 |
| C-15 | "Marcar no disponible": ¿el negocio o un plato? ¿Qué ícono? | T-13, T-24 |
| C-16 | Íconos de sección: `IdentificationCard` (perfil) y `Cube` (producto). ¿Ok? | T-13 |
| C-17 | "Primeros 5 usos" = 5 ejecuciones de la opción. ¿Ok? | T-11 |
| C-19 | Si `onSelect` falla, no se ofrece deshacer y se muestra un error. ¿Ok? | T-19 |
| C-04, C-08, C-09, C-11, C-13, C-18, C-20 | Propuestas menores en `design.md` §9; si no dices nada, se aplican tal cual. | varias |
