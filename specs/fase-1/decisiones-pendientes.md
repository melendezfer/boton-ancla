# Decisiones pendientes — Fase 1

Puntos que necesitan tu decisión. Al decidirlos pasan a `design.md` §0 y a `spec.md`, y se borran de aquí.

---

## HM-06 · ¿Dónde va "Ocultar teclado" en el abanico?

**Ya decidido por ti:** con el teclado abierto, el ancla no se oculta. Sube, queda sobre el teclado, y ofrece "Cerrar" (90°) y "Ocultar teclado" (quita el foco del campo).

**Lo que falta:** la posición de "Ocultar teclado". Con la búsqueda abierta en el Mapa y el teclado arriba, hoy el abanico tendría Cerrar (90°, reemplazando a Favoritos), Mi ubicación (120°), Buscar (150°, prioridad 1) y Ofertas cerca (180°).

| Opción | Cómo queda | A favor | En contra |
|---|---|---|---|
| **A (propuesta) — "modo escritura"** | Con el teclado abierto, el abanico muestra **solo dos opciones**: **Cerrar a 90°** (arriba) y **Ocultar teclado a 180°** (lateral). Las acciones de la pantalla se esconden mientras se escribe. | Muy fácil de memorizar: arriba = salir y lateral = bajar el teclado, en cualquier app. Nada se encima con Deshacer (C-21). No pasa de 5. | Mientras se escribe no se pueden usar las otras acciones sin bajar antes el teclado. |
| **B — reemplazar la prioridad 1** | "Ocultar teclado" ocupa el lugar de la prioridad 1 (como Deshacer); el resto no se mueve. | Todo lo demás sigue disponible. | Choca con C-21 si hay algo para deshacer al mismo tiempo (los dos quieren el mismo lugar). |
| **C — reemplazar el extremo lateral (180°)** | "Ocultar teclado" reemplaza la opción de 180°. | Posición fija y fácil de memorizar. | Esconde una acción de la pantalla al azar (en el Mapa, Ofertas cerca). |

**Mi propuesta:** **A**. Mientras se escribe, lo único que se necesita del ancla es salir o bajar el teclado, y dos posiciones fijas son las más fáciles de encontrar sin mirar.

**Qué más cambia con HM-06:**
- **RF-13** pasa de "ocultar" a "subir sobre el teclado". El alto útil pasa a ser el visible (`visualViewport`).
- `ANCLA_ALTURA` se aplica sobre ese alto visible: con un teclado de ~300 px en 667 px, el ancla queda a ~160 px sobre el teclado y el abanico todavía cabe (el techo de HM-01 lo garantiza; si no cabe, gana el piso).
- Nuevo id reservado `"ocultar-teclado"`, que el adaptador ejecuta con `blur()` del campo enfocado. No necesita API nueva.
