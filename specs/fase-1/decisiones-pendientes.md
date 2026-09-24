# Decisiones pendientes — Fase 1

Puntos que necesitan tu decisión, explicados con calma. Al decidirlos pasan a `design.md` §0 y a `spec.md`, y se borran de aquí.

---

## HM-02 · Etiquetas del abanico tapadas por los íconos vecinos *(hallazgo de prueba manual)*

**Qué tareas bloquea:** T-16 (etiqueta de la preselección, RF-06) y T-23 (bienvenida, HU-12). La vista previa fantasma de la demo se ajusta cuando se decida.

### El problema
En el Mapa, "Mi ubicación" queda debajo de Buscar, y "Buscar" debajo de Ofertas cerca. No es un detalle de la vista previa, es geométrico:

| Vecinas (Mapa, radio 100 px) | Distancia entre centros | Cuánto más abajo está la siguiente |
|---|---|---|
| 90° → 120° | 52 px | 13 px |
| 120° → 150° | 52 px | 37 px |
| 150° → 180° | 52 px | 50 px |

Una etiqueta de ~14 px de alto y 50–90 px de ancho junto a cada ícono, sea debajo o encima, cae sobre la opción vecina. Y afecta a tres reglas de la spec:
- **HU-12** (bienvenida): "cada opción muestra su etiqueta durante sus primeros 5 usos". Si se muestran todas a la vez, chocan.
- **RF-06**: la etiqueta de la preselección va "por encima del dedo". Pero el dedo **está sobre** la opción, así que "encima del dedo" es donde está la vecina de arriba.
- **RNF-06**: texto ≥ 4,5:1. Una etiqueta montada sobre otro ícono no se lee.

### Opciones

**A (propuesta) — Una sola etiqueta, en una banda fija encima del abanico**
- Mientras el menú está abierto, hay **una sola** etiqueta visible: la de la opción preseleccionada (en gesto) o con foco (en teclado).
- Va en una **banda fija arriba del abanico**, por encima de la opción de 90°, con un margen de ~8 px. Horizontalmente queda centrada sobre el arco y ajustada para no salirse de la pantalla. Con la mano izquierda se refleja.
- **No queda bajo el pulgar:** el pulgar llega desde abajo y desde el costado, y la banda está arriba de todo lo que el pulgar alcanza.
- **No tapa el contenido más de lo que ya lo tapa el abanico:** solo existe mientras el menú está abierto y ocupa una franja de ~28 px.
- Fondo `surface` sólido y texto `text`, así el contraste no depende de lo que haya detrás (RNF-06).
- En la zona muerta (sin preselección), la banda muestra el nombre de la sección, o nada. Ver sub-pregunta 3.
- El centro del ancla sigue anticipando el ícono (D-09): **ícono en el centro y nombre en la banda**, dos señales que no se tapan entre sí.

Consecuencias en la spec:
- RF-06 cambia "por encima del dedo" por "en la banda fija encima del abanico".
- HU-12 cambia "cada opción muestra su etiqueta" por "la banda muestra la etiqueta, más destacada, durante los primeros 5 usos de esa opción". Ver sub-pregunta 2.
- El **techo** de `ANCLA_ALTURA` (HM-01) se sube ~36 px para que la banda también quepa arriba.

**B — Etiquetas radiales, fuera del arco**
Cada etiqueta va más afuera, en la dirección de su opción (a ~R + 40 px). Hacia afuera hay más espacio (a 153 px, las vecinas quedan a ~60–80 px), pero las etiquetas largas ("Ofertas cerca", "Marcar no disponible") siguen chocando en las posiciones diagonales, salvo que se recorten o se giren. Tapa más contenido y es más difícil de leer mientras se desliza.

**C — Etiquetas junto al ícono, pero solo la preseleccionada**
Es la regla actual de RF-06 aplicada literalmente. Soluciona la bienvenida solo a medias y la etiqueta sigue cayendo sobre una vecina o bajo el dedo, según la dirección.

### Sub-preguntas (si eliges A)
1. **Modo toque** (menú abierto sin dedo apoyado): ¿cómo sabe la persona qué es cada ícono? Propuesta: al **presionar** una opción, la banda muestra su nombre antes de soltar. Si no era esa, se arrastra fuera y no pasa nada (regla C-06, ya decidida). Con lector de pantalla, cada opción ya tiene su nombre accesible.
2. **Bienvenida (HU-12):** propuesta: durante los primeros 5 usos de una opción, su etiqueta aparece en la banda más grande y más tiempo. En modo toque, mientras no se presiona nada, la banda muestra la indicación "Desliza o toca un ícono". Nunca se muestran todas las etiquetas a la vez.
3. **Zona muerta:** ¿la banda muestra el nombre de la sección ("Mapa") o se oculta? Propuesta: el nombre de la sección, en gris, porque confirma dónde estás (D-09) sin agregar nada nuevo.

### Mi propuesta
**A**, con las tres sub-propuestas. Es la sugerencia que diste, y además resuelve RF-06 y HU-12 con una sola pieza.
