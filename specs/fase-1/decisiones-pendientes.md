# Decisiones pendientes — Fase 1

Puntos que necesitan tu decisión, explicados con calma. Al decidirlos pasan a `design.md` §0 y a `spec.md`, y se borran de aquí.

---

## C-22 · Pantalla que solo tiene "Atrás": ¿arriba o en la diagonal? *(apareció en T-04)*

**Qué tareas bloquea:** ninguna todavía. Importa en T-13 y T-24, porque las pantallas Ajustes y Métricas de la demo solo tienen "Atrás".

### El problema
Dos reglas decididas chocan cuando el abanico tiene **una sola** opción:
- **C-01 / design §4.3:** con 1 opción, la posición va en la diagonal (135°), la más cómoda.
- **D-10 / spec §6:** "Atrás" ocupa **siempre** el extremo "arriba" (90°), pegado al borde, para memorizarlo.

Hoy el código aplica la primera: en una pantalla que solo trae `back`, "Atrás" queda en la diagonal (135°). En cualquier otra pantalla queda arriba (90°). Quien usa el modo experto aprende "Atrás = deslizar hacia arriba", y justo en esas pantallas le fallaría.

Lo mismo pasa con "Deshacer" en esa situación: con "Atrás" + "Deshacer" (2 opciones) no hay problema, porque "Atrás" va a 90° y "Deshacer" a 180°.

### Opciones
- **A (propuesta):** si la única opción es "Atrás", va a 90° (arriba). Con cualquier otra opción única, sigue en la diagonal. Cambio pequeño: `computeFanLayout` recibe un dato opcional con el ángulo de la opción única, y `assignActions` no cambia.
- **B:** dejarlo como está (diagonal). Más simple, pero rompe D-10 en esas pantallas.
- **C:** que Ajustes y Métricas no muestren el ancla, o que agreguen una segunda acción. Evita el caso en la demo, pero no en las apps que integren el componente.

### Mi propuesta
**A**, porque D-10 es una regla de memoria muscular, y esas reglas sirven justo cuando no tienen excepciones.
