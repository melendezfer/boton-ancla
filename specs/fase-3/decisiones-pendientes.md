# Decisiones pendientes — Fase 3

Preguntas que necesito que decidas antes de escribir el diseño y el código. Cada una trae mi propuesta. Al decidirlas, pasan a `spec.md` (y luego a `design.md`) y se borran de aquí.

---

**Ya decididas** (26-09-2026, pasaron a `spec.md` 0.2): las zonas tienen dos niveles, **obligatorias** (nunca se tapan, como el crédito de OpenStreetMap) y preferidas; **la mano se deduce del costado** donde se deja el ancla (H13); H11 y H13 ya están en la spec.

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

**Propuesta:** **A** ahora, y ver en las sesiones con personas si hace falta algo más rápido. **B** no la recomiendo por el choque con las irreversibles. Ojo: H13 pide que sea **fácil e intuitivo** para quien usa las dos manos según el momento; si con A no lo es en la prueba manual, **C** es la siguiente.

## 4. Horizontal: ¿qué pasa si el abanico no cabe hacia arriba?

En horizontal hay poco alto (y con teclado, casi nada).

- **A — El abanico se abre hacia abajo** cuando no cabe hacia arriba (esto también responde P-05 de la Fase 1). *Pro:* usa el espacio que hay. *Contra:* las posiciones de las opciones cambian según la altura.
- **B — El ancla baja sola** hasta donde el abanico cabe. *Pro:* las opciones no cambian de lugar. *Contra:* puede quedar muy abajo, lejos del pulgar.
- **C — En horizontal con teclado, el ancla se oculta.** *Pro:* simple. *Contra:* rompe RF-13 (el ancla nunca se oculta con teclado).

**Propuesta:** **B** primero y, si no alcanza, **A**. Así en vertical nada cambia.

## 5. Horizontal: altura de inicio

La de vertical (44 % del alto) en horizontal queda muy arriba con poco alto.

**Propuesta:** una altura propia para horizontal, **30 %** (`ANCLA_ALTURA_H`), que se ajusta con la prueba manual.

## 6. ¿Solo el ancla evita las zonas, o también el abanico abierto?

**Propuesta:** **también el abanico, la banda y los avisos**. Para lograrlo, el ancla se corre (más arriba o más abajo) hasta que todo lo que dibuja queda fuera de las zonas. Así las opciones nunca cambian de lugar por una zona.

## 7. Con una hoja inferior abierta, ¿dónde va el ancla? (H11)

H11 dice que el ancla debe descontar las hojas inferiores abiertas. Hoy (HM-07, Fase 1) el ancla queda **encima** de la hoja y la hoja le **reserva su columna** (la franja del lado del ancla), así la X de la hoja no queda tapada.

- **A — Seguir como hoy (HM-07).** *Pro:* ya está probado en el Nubia y en las pruebas automáticas; el ancla no salta. *Contra:* la hoja pierde el ancho de esa columna.
- **B — El ancla sube por encima de la hoja** (la hoja cuenta como zona). *Pro:* la hoja usa todo el ancho. *Contra:* el ancla cambia de altura cada vez que se abre una hoja, y puede quedar lejos del pulgar si la hoja es alta.

**Propuesta:** **A**: cumple H11 (la hoja se descuenta: su columna es del ancla y nada se tapa) sin que el ancla salte.

## 8. ¿Cómo pregunta la bienvenida la mano? (H13)

- **A — Al empezar, el ancla aparece en el centro de abajo y dice "¿Con qué mano? Desliza hacia ese lado".** Deslizar la lleva a ese costado. *Pro:* se hace deslizando (D-15) y ya enseña a mover el ancla. *Contra:* una pantalla más al inicio.
- **B — Dos botones "Derecha / Izquierda".** *Pro:* muy claro. *Contra:* pide un toque (aunque D-15 permite el toque como alternativa si también se puede deslizar).

**Propuesta:** **A**, con **B** como alternativa visible para quien prefiera tocar.

## 9. El control deslizante de altura de la demo

Hoy la altura del ancla se ajusta en Ajustes con un deslizador (HM-01).

**Propuesta:** dejarlo mientras se prueba el arrastre (sirve para comparar) y quitarlo cuando el arrastre esté aprobado.
