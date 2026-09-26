# Decisiones pendientes — Fase 3

Preguntas que necesito que decidas antes de escribir el diseño y el código. Cada una trae mi propuesta. Al decidirlas, pasan a `spec.md` (y luego a `design.md`) y se borran de aquí.

---

## 1. ¿Por dónde se entra a "mover el ancla"?

Mantener presionado ya significa "descanso" (D-12), así que no se puede usar. Mover hacia abajo es el joystick.

- **A — Una opción "Mover ancla" en el abanico de Ajustes**, a la que se llega deslizando y se queda encima un momento (como Zoom). *Pro:* no choca con nada y es un solo gesto. *Contra:* hay que ir a Ajustes para moverla.
- **B — La misma opción en el abanico de todas las pantallas.** *Pro:* siempre a mano. *Contra:* ocupa uno de los 5 lugares en cada pantalla.
- **C — Un botón "Mover el ancla" dentro de la pantalla de Ajustes** (además de A). *Pro:* fácil de descubrir. *Contra:* ese camino usa un toque (D-15 se cumple igual con A).

**Propuesta:** **A + C**. Se mueve poco; conviene que sea seguro más que rápido.

## 2. ¿Dónde puede quedar el ancla?

- **A — En cualquier altura de los dos costados**, y al soltar se pega al costado más cercano. *Pro:* cada quien la pone donde le quede mejor. *Contra:* muchas posiciones; más difícil de volver a "la de antes".
- **B — Solo en 3 alturas por costado** (baja, media, alta). *Pro:* simple y fácil de recordar. *Contra:* puede que ninguna sea la cómoda.

**Propuesta:** **A**, con un "clic" suave (vibración en Android) al pasar por la altura de inicio, para poder volver a ella.

## 3. ¿Cómo se cambia de mano rápido? (P-03)

- **A — Arrastrando el ancla al otro costado en "mover el ancla"** (queda cubierto por la pregunta 1). *Pro:* no hay que aprender nada nuevo. *Contra:* no es instantáneo (entrar a mover, cruzar, soltar).
- **B — "Lanzar" el ancla**: deslizar rápido y largo hasta el otro costado. *Pro:* muy rápido. *Contra:* choca con el modo experto y con "deslizar más allá" para confirmar las acciones irreversibles (por ejemplo "Eliminar" en el costado).
- **C — Una opción "Cambiar de mano" en el abanico** (inofensiva). *Pro:* un solo gesto. *Contra:* ocupa un lugar.

**Propuesta:** **A** ahora, y ver en las sesiones con personas si hace falta algo más rápido. **B** no la recomiendo por el choque con las irreversibles.

## 4. ¿El costado y la mano van siempre juntos?

Hoy, mano derecha = ancla a la derecha y abanico hacia la izquierda.

- **A — Siempre juntos**: el costado define la mano. *Pro:* una sola cosa que entender. *Contra:* no sirve para quien usa la mano derecha con el ancla a la izquierda (raro).
- **B — Separados**: costado y mano se eligen aparte. *Pro:* flexible. *Contra:* más opciones y combinaciones que probar.

**Propuesta:** **A**.

## 5. Horizontal: ¿qué pasa si el abanico no cabe hacia arriba?

En horizontal hay poco alto (y con teclado, casi nada).

- **A — El abanico se abre hacia abajo** cuando no cabe hacia arriba (esto también responde P-05 de la Fase 1). *Pro:* usa el espacio que hay. *Contra:* las posiciones de las opciones cambian según la altura.
- **B — El ancla baja sola** hasta donde el abanico cabe. *Pro:* las opciones no cambian de lugar. *Contra:* puede quedar muy abajo, lejos del pulgar.
- **C — En horizontal con teclado, el ancla se oculta.** *Pro:* simple. *Contra:* rompe RF-13 (el ancla nunca se oculta con teclado).

**Propuesta:** **B** primero y, si no alcanza, **A**. Así en vertical nada cambia.

## 6. Horizontal: altura de inicio

La de vertical (44 % del alto) en horizontal queda muy arriba con poco alto.

**Propuesta:** una altura propia para horizontal, **30 %** (`ANCLA_ALTURA_H`), que se ajusta con la prueba manual.

## 7. Zonas reservadas: ¿todas son igual de importantes?

- **A — Dos niveles:** **obligatorias** (nunca se tapan, por ejemplo el crédito de OpenStreetMap, que la licencia obliga a mostrar) y **preferidas** (se evitan, pero si no hay otra posición se pueden tapar). *Pro:* realista. *Contra:* la app tiene que elegir el nivel.
- **B — Un solo nivel** (nunca se tapa ninguna). *Pro:* simple. *Contra:* si no hay lugar, el ancla no tiene dónde quedar.

**Propuesta:** **A**, con "preferida" por defecto.

## 8. ¿Solo el ancla evita las zonas, o también el abanico abierto?

**Propuesta:** **también el abanico, la banda y los avisos**. Para lograrlo, el ancla se corre (más arriba o más abajo) hasta que todo lo que dibuja queda fuera de las zonas. Así las opciones nunca cambian de lugar por una zona.

## 9. H11 y H13

La spec de la Fase 1 cita los hallazgos H12 y H14 del documento de origen, pero **H11 y H13 no están en el repositorio** y no los pude leer.

**Propuesta:** que me compartas su texto (o me digas dónde está el documento) para incluirlos. Mientras tanto, la spec sigue sin ellos.

## 10. El control deslizante de altura de la demo

Hoy la altura del ancla se ajusta en Ajustes con un deslizador (HM-01).

**Propuesta:** dejarlo mientras se prueba el arrastre (sirve para comparar) y quitarlo cuando el arrastre esté aprobado.
