# Decisiones pendientes — Fase 1

Cuando aparezca un punto nuevo que necesite explicación larga, se escribe aquí: problema, ejemplo concreto, opciones y propuesta. Al decidirlo, pasa a `design.md` §0 y a `spec.md`, y se borra de aquí.

---

## 1. Zoom del mapa con una mano (HM-11)

**Problema.** Con el joystick (HM-11) ya se puede **mover** el mapa con una mano, pero para **acercar o alejar** hace falta pellizcar con dos dedos, o con el pulgar y otra mano. En el bus, con una mano ocupada, no se puede.

**Ejemplo.** Buscas la parada en el mapa: lo mueves con el joystick hasta la zona, pero los nombres de las calles se ven muy pequeños y no puedes acercar sin soltar el pasamanos.

**Restricciones.** Todo debe poder hacerse **solo deslizando** (D-15). No debe chocar con el joystick (hacia abajo), con el abanico (hacia el arco) ni con el modo toque (C-06).

### Opción A — "Acercar" y "Alejar" como opciones del abanico del mapa
Dos acciones normales (lupa + / lupa −). Cada gesto hace un paso de zoom.
- **Pro:** no inventa ningún gesto nuevo, se descubre sola (está en el abanico) y funciona también con toque y teclado. Es la más simple de construir y de probar.
- **Contra:** ocupa 2 de las 5 posiciones del abanico del mapa (hoy tiene 4 opciones: habría que sacar una o llegar al máximo). Para acercar mucho hay que repetir el gesto varias veces.

### Opción B — Opción "Zoom" que convierte el ancla en un deslizador (recomendada)
Una sola opción "Zoom" en el abanico. Al llegar a ella **sin soltar**, el ancla pasa a un modo deslizador vertical, igual al joystick de HM-09: pulgar arriba = acercar, abajo = alejar, más lejos = más rápido. Al soltar, se queda en ese zoom.
- **Pro:** zoom continuo y preciso con un solo gesto. Reusa lo que ya se aprendió con el joystick (misma curva, misma guía de HM-10). Ocupa una sola posición del abanico.
- **Contra:** es un modo más que aprender, y hay que diseñar bien la transición de "sobre la opción" a "deslizador" para que no se active sin querer (por ejemplo, una espera corta sobre la opción). Es la más larga de construir.

### Opción C — Doble toque en el ancla y deslizar (como Google Maps con un dedo)
Tocar el ancla dos veces rápido y, en el segundo toque, deslizar arriba o abajo para acercar o alejar.
- **Pro:** es un gesto que muchos ya conocen de Google Maps y no ocupa posiciones del abanico.
- **Contra:** choca con el modo toque (C-06): el primer toque abre el abanico, así que habría que esperar para saber si viene un segundo, y eso hace más lento el toque normal. Es difícil de descubrir y de explicar en la bienvenida.

**Propuesta:** **B**, y si se quiere algo para las sesiones ya, **A** como paso intermedio.

**Estado (26-09-2026):** el usuario **prefiere B**, pero **no se implementa todavía**. Cómo se activaría sin chocar: "Zoom" es una opción más del abanico del mapa; el deslizador se activa solo si el pulgar **se queda sobre ella** `T_ZOOM_ESPERA` (≈ 300 ms, parámetro). Pasar por encima o soltar rápido (modo experto) no lo activa. El joystick no se toca: él entra **hacia abajo desde el ancla**, y el zoom **desde una opción del arco** (arriba o de lado). Dentro del deslizador: arriba = acercar, abajo = alejar, más lejos = más rápido; al soltar se queda en ese zoom.
