# Prueba de la Fase 3, Bloque B: girar, zonas, mover el ancla y la mano

Qué cambió, qué hacer con el pulgar en el Nubia y qué deberías sentir. Para levantar la demo y la red, ver `specs/fase-1/estado.md` §4–§5 (o la demo publicada, si ya se subió).

**Importante:** el Bloque B es el **componente**. Todavía **no está conectado a las pantallas de la demo** (eso es el Bloque C: el mapa con el crédito de OpenStreetMap, "Mover ancla" en Ajustes y guardar la posición). Por eso, casi todo se prueba en una **página de prueba**: **Diagnóstico → "Prueba de la Fase 3"**.

---

## 0. Estado

| Tarea | Commit | Qué |
|---|---|---|
| T3-06 | `09ce3ae` | El ancla abajo en cada orientación, con una posición por orientación |
| T3-07 | `8f1c39c` | Zonas reservadas que el ancla no tapa; página de prueba |
| T3-08 | `c540bb1` | Mover el ancla arrastrándola (tramos válidos, imán, cambio de mano) |
| T3-09 | `6f1ba49` | La bienvenida pregunta la mano |

Pruebas: **616** del núcleo, **55** de la demo y **388** E2E, todas en verde.

**Límite:** la posición que dejes al mover el ancla **todavía no se guarda al recargar** (se guarda solo mientras la página está abierta); guardarla es del Bloque C (T3-10). Tampoco cambia el control "Mano" de Ajustes: si lo tocas, el ancla vuelve a partir de él.

---

## 1. Girar el celular (T3-06)

1. Abre cualquier pantalla (por ejemplo el Negocio) en vertical.
2. **Gira el celular a horizontal.**
   - **Deberías ver:** el ancla **abajo**, del **mismo costado**, bastante más baja que en vertical (30 % del alto). El abanico cabe completo.
3. **Vuelve a vertical.**
   - **Deberías ver:** el ancla vuelve **exactamente** a donde estaba en vertical.
4. Abre el abanico y, con el dedo apoyado, gira: se cancela y el ancla aparece en la otra orientación.

## 2. Mover el ancla (T3-08) — en la página de prueba

### 2.1 Solo deslizando
1. Diagnóstico → **Prueba de la Fase 3**.
2. Abre el abanico y desliza hasta **"Mover ancla"** (el ícono de cuatro flechas). **Quédate quieto** un tercio de segundo.
   - **Deberías ver:** el ancla **se engancha a tu pulgar**. En los dos costados aparecen **líneas de color** (dónde puede quedar), una **rayita** en la altura de inicio y un **cuarto de círculo punteado** (dónde quedaría el abanico).
3. **Arrástrala** hacia arriba o abajo. Al pasar por la rayita de inicio, sentirás un **"clic"** (vibración corta en Android).
4. **Suéltala** en cualquier lugar.
   - **Deberías ver:** el ancla **se va sola** al costado más cercano, a esa altura (o a la válida más cercana). Si la sueltas muy arriba, queda donde el abanico todavía cabe.

### 2.2 Cambiar de mano (P-03)
1. Entra a mover el ancla (como en 2.1) y **llévala al otro costado**. Suéltala.
   - **Deberías ver:** el ancla queda del otro lado y **el abanico se abre hacia el centro** (espejo). Esa es la forma de cambiar de mano.
2. Pregunta clave: **¿se siente fácil e intuitivo** para cuando cambias de mano según el momento (H13)? Si no, la siguiente opción es un "Cambiar de mano" en el abanico (DF3-03).

### 2.3 Arrepentirse
- Mientras arrastras, **pon un segundo dedo**: el ancla vuelve a donde estaba y no se guarda nada.

### 2.4 Con el botón
- Toca **"Mover el ancla"** (el botón grande de la página): el ancla **late** con un borde punteado. **Tócala y arrástrala.** Tocar fuera o esperar 4 s lo cancela.
- Soltar rápido sobre la opción "Mover ancla" (sin quedarse quieto) hace lo mismo que el botón.

## 3. Zonas reservadas (T3-07) — en la página de prueba

1. Toca **"Zona como el crédito del mapa"**: aparece un recuadro punteado **abajo a la derecha** ("obligatoria").
   - **Deberías ver:** el ancla, su abanico abierto, la banda y los avisos **nunca** lo tapan.
2. Mueve el ancla (2.1) e intenta soltarla **sobre** el recuadro.
   - **Deberías ver:** el imán la deja **fuera** del recuadro, con un pequeño margen.
3. Toca **"Agrandar la zona 1"** con el abanico **cerrado**: el ancla se corre para no taparla. (Si la agrandas mientras usas el ancla, se corre recién al soltar.)
4. Toca **"Quitar las zonas"**: el ancla vuelve a su lugar guardado.

## 4. La bienvenida pregunta la mano (T3-09)

1. **Ajustes → "Repetir la bienvenida".**
   - **Deberías ver:** en vez del ancla, un **asa redonda** abajo al centro con **"¿Con qué mano? Desliza hacia ese lado"** y dos botones, **Izquierda** y **Derecha**.
2. **Desliza el asa** hacia un costado (más de un dedo de distancia).
   - **Deberías ver:** el ancla aparece de ese lado y sigue la demostración de siempre (una opción sale y vuelve).
3. Un deslizamiento **corto** no decide: el asa vuelve al centro. Los botones también sirven.

---

## 5. Qué contarme
1. **Girar:** ¿el 30 % en horizontal queda cómodo? ¿Y al volver a vertical?
2. **Mover:** ¿se entiende que hay que **quedarse quieto** sobre "Mover ancla"? ¿Las líneas y la silueta ayudan a elegir dónde dejarla? ¿El imán se siente natural?
3. **Cambiar de mano arrastrando:** ¿fácil e intuitivo, o hace falta "Cambiar de mano" en el abanico?
4. **Zonas:** ¿el margen alrededor del recuadro es suficiente?
5. **Bienvenida:** ¿la pregunta de la mano se entiende sin explicación?
