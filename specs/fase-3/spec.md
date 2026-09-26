# Botón-ancla — Especificación Fase 3: adaptación al espacio

Versión 0.1 (borrador para decidir) · Primera app base: RUTEANDO · Continúa la Fase 1 (`specs/fase-1/spec.md` v0.16)

> Esta spec es la fuente de verdad de la Fase 3. Lo que no cambia aquí sigue como en la Fase 1. Lo marcado **(a decidir)** espera una respuesta en `decisiones-pendientes.md`; no se escribe código hasta cerrarlo.

La Fase 3 hace que el ancla **se adapte al espacio**: la persona la puede mover a donde le quede cómoda, cambiar de mano rápido, usarla en horizontal, y la app puede declarar partes de la pantalla que el ancla no debe tapar.

---

## 0. Alcance

### Incluye
- **Mover el ancla arrastrándola** (modo edición), con imán a posiciones válidas, solo deslizando (§3, HU3-01…HU3-04).
- **Cambio rápido de mano** (cierra P-03 de la Fase 1) (HU3-05, HU3-06).
- **Orientación horizontal**: el ancla en la parte inferior de la orientación actual, con una posición recordada para cada orientación (HU3-07…HU3-09).
- **Zonas reservadas**: una API para que la app declare áreas que el ancla, el abanico, la banda y los avisos no deben tapar (HU3-10…HU3-12).
- En la demo: las zonas reales de RUTEANDO (§8) y la forma de probar todo lo anterior en PC y celular.

### Fuera de la Fase 3 (y por qué)
| Queda fuera | Fase | Motivo |
|---|---|---|
| Carrusel, submenús y más de 5 opciones | 4 | Igual que en la Fase 1. |
| Aprender la posición o la mano sola (sin que la persona la mueva) | 5 | Primero la interacción, después la inteligencia (Documento 7). |
| HM-16 (imán del mapa más fuerte), zoom fino | después | Son de "apuntar y elegir", no de adaptación al espacio (`fase-1/estado.md` §3). |
| Adaptadores Web Component y React Native | 6 | Igual que en la Fase 1. |

---

## 1. Lo que se hereda de la Fase 1

| ID | Qué dice | Qué hace la Fase 3 con eso |
|---|---|---|
| D-12 (H12) | Mantener quieto es **descanso**, así que mover el ancla **no puede activarse manteniendo presionado**. El arrastre llega en la Fase 3. | Se respeta: el modo edición no se abre con una pulsación larga (RF3-01). |
| D-15 | Todo se puede hacer **solo deslizando**. | Mover el ancla y cambiar de mano también (RF3-01, RF3-05). |
| D-17 (H14, H15) | El ancla queda en la **parte inferior de la orientación actual**, del lado elegido, por encima de las hojas; su altura es `ANCLA_ALTURA`. | Se extiende: la altura y el lado los elige la persona **por orientación** (RF3-07). |
| C-18 | Las preferencias se guardan con una clave que ya incluye la orientación. | Se usa: una posición por orientación (RF3-08). |
| RF-09 | Un cambio de orientación cancela la interacción. | Se mantiene; además se recoloca el ancla (RF3-09). |
| RF-12, L-02 | Márgenes: 24 px al costado (`MARGEN_LATERAL`), 16 px abajo (`MARGEN_INFERIOR`), respetando las áreas seguras. | Siguen siendo el borde de las posiciones válidas (§2). |
| HM-01 | `ANCLA_ALTURA` con piso y techo: si el abanico no cabe arriba, el ancla deja de subir. En la demo, un control deslizante. | El piso y el techo pasan a ser el rango de posiciones válidas (RF3-03). |
| RF-13, RF-16 | Con teclado, el ancla sube sobre él; las hojas reservan su espacio (`useAnchorReserva`, HM-07). | Siguen igual. `useAnchorReserva` es lo inverso de las zonas reservadas: la app deja espacio **al ancla**; con las zonas, el ancla deja espacio **a la app**. |
| D-06 | En RUTEANDO el ancla reemplaza la pila de botones de la derecha. | La pila ya no está; lo que queda en las esquinas son zonas reservadas (§8). |
| P-03 | ¿Qué gesto rápido sirve para cambiar de mano? | Se responde en HU3-05 (a decidir). |
| P-05 | Con el ancla alta, ¿el abanico se abre también hacia abajo? | Encaja aquí: si la persona pone el ancla arriba o en horizontal, el abanico puede no caber hacia arriba (**a decidir**). |
| H11, H13 | Hallazgos del documento de origen. | **No están en el repositorio**: no se pudieron revisar (**a decidir**: compartir sus textos). |

---

## 2. Glosario

- **Modo edición:** mientras dura, arrastrar el ancla la **mueve** en vez de abrir el abanico. Se ve distinto (§3).
- **Posición válida:** donde el ancla puede quedar: pegada a un costado (izquierdo o derecho), entre el piso y el techo de altura, sin que el ancla, su abanico ni su banda tapen una zona reservada ni salgan de las áreas seguras.
- **Imán:** al soltar el ancla en modo edición, se va sola a la posición válida más cercana.
- **Lado:** izquierdo o derecho. El lado y la mano van juntos: el abanico siempre se abre hacia el centro de la pantalla (**a decidir** si se separan).
- **Zona reservada:** un rectángulo de la pantalla que la app declara para que el ancla no lo tape (un botón, un logo, un aviso legal).
- **Orientación:** vertical u horizontal. Cada una recuerda su propia posición.

---

## 3. Cambios en la máquina de estados (propuesta)

```
abierto_gesto ──se queda sobre "Mover ancla" T_ESPERA_DESLIZADOR──▶ editando            (RF3-01; mismo patrón que Zoom, RF-20)
abierto_gesto ──suelta sobre "Mover ancla" sin esperar──▶ cancelado + pista             (RF3-01)
editando ──mueve──▶ editando (el ancla sigue al pulgar; se marcan las posiciones válidas)
editando ──suelta──▶ reposo, con el ancla en la posición válida más cercana (imán)      (RF3-03)
editando ──segundo dedo | orientación | cambio de sección──▶ cancelado, el ancla vuelve a donde estaba
```

- Se entra desde una **opción del abanico** ("Mover ancla"), quedándose sobre ella, como con Zoom. Así no choca con el **descanso** (quieto sobre el ancla, D-11/D-12), ni con el **joystick** (primer movimiento hacia abajo, RF-18), ni con el **modo experto** (soltar rápido, D-08/C-05). Dónde aparece esa opción: **a decidir**.
- Todo en **un solo gesto**: llegar a la opción, esperar, arrastrar y soltar. Sin toques (D-15).
- La máquina sigue siendo pura (D-18): el adaptador calcula las posiciones válidas y el imán con funciones del núcleo.

---

## 4. Historias de usuario

**HU3-01 — Entrar a mover el ancla sin chocar con nada**
```gherkin
Dado que abro el abanico y llego a la opción "Mover ancla"
Cuando me quedo sobre ella T_ESPERA_DESLIZADOR
Entonces el ancla entra en modo edición y se engancha a mi pulgar
Dado que suelto sobre "Mover ancla" sin esperar
Entonces no pasa nada y la banda dice "Mantén sobre Mover ancla para moverla"
Dado que dejo el pulgar quieto sobre el ancla
Entonces entra en descanso como siempre (no en modo edición)
```

**HU3-02 — Arrastrar el ancla**
```gherkin
Dado que estoy en modo edición
Cuando muevo el pulgar
Entonces el ancla lo sigue y veo marcadas las posiciones válidas de los dos costados
Y veo tenue dónde quedaría el abanico (para no tapar lo que necesito)
```

**HU3-03 — Soltar con imán**
```gherkin
Dado que estoy en modo edición y suelto el ancla en cualquier lugar
Entonces el ancla va sola a la posición válida más cercana
Y esa posición queda guardada para esta orientación
Dado que la suelto sobre una zona reservada
Entonces va a la posición válida más cercana fuera de esa zona
```

**HU3-04 — Arrepentirme**
```gherkin
Dado que estoy en modo edición
Cuando pongo un segundo dedo, giro el celular o la app cambia de sección
Entonces el ancla vuelve a donde estaba y no se guarda nada
```

**HU3-05 — Cambio rápido de mano (P-03)**
```gherkin
Dado que estoy en modo edición con el ancla en el costado derecho
Cuando la arrastro y la suelto más cerca del costado izquierdo
Entonces el ancla queda a la izquierda y el abanico se abre hacia la derecha (mano izquierda)
```
(La forma rápida exacta está **a decidir**: esta es la mínima; hay otras en `decisiones-pendientes.md`.)

**HU3-06 — La mano se recuerda**
```gherkin
Dado que cambié de mano
Cuando vuelvo a abrir la app
Entonces el ancla sigue del lado que elegí, en esta orientación
```

**HU3-07 — Horizontal: siempre abajo**
```gherkin
Dado que giro el celular a horizontal
Entonces el ancla queda en la parte inferior de la pantalla horizontal, en un costado
Y el abanico cabe completo (o se adapta, a decidir)
```

**HU3-08 — Una posición por orientación**
```gherkin
Dado que puse el ancla alta a la derecha en vertical y baja a la izquierda en horizontal
Cuando giro el celular de una a otra
Entonces cada vez el ancla vuelve a la posición que dejé en esa orientación
Dado que es la primera vez en horizontal
Entonces usa el mismo lado que en vertical y la altura de inicio
```

**HU3-09 — Girar en medio de algo**
```gherkin
Dado que tengo el abanico abierto o estoy desplazando
Cuando giro el celular
Entonces se cancela (RF-09) y el ancla aparece en su posición de la nueva orientación
```

**HU3-10 — La app declara una zona reservada**
```gherkin
Dado que la app declara el crédito de OpenStreetMap como zona reservada
Entonces ni el ancla, ni su abanico, ni su banda, ni sus avisos lo tapan
Y si la posición guardada lo taparía, el ancla se corre a la posición válida más cercana sin olvidar la guardada
```

**HU3-11 — Las zonas cambian**
```gherkin
Dado que una zona reservada cambia de tamaño, aparece o desaparece
Entonces el ancla se recoloca (sin moverse mientras la estoy usando)
```

**HU3-12 — No hay lugar**
```gherkin
Dado que las zonas reservadas no dejan ninguna posición válida
Entonces el ancla respeta primero las zonas obligatorias y puede tapar las preferidas (a decidir)
Y la app ve un aviso en la consola de desarrollo
```

---

## 5. Requisitos (formato EARS)

- **RF3-01** Cuando la persona se quede `T_ESPERA_DESLIZADOR` sobre la opción "Mover ancla", el ancla entrará en **modo edición** y seguirá al pulgar hasta soltar. Soltar sobre la opción sin esperar mostrará una pista y no hará nada. Nunca se entrará con una pulsación larga sobre el ancla (D-12).
- **RF3-02** Mientras esté en modo edición, el sistema mostrará las **posiciones válidas** de ambos costados y una silueta tenue del abanico en la posición actual. El contenido no recibirá los toques.
- **RF3-03** Cuando la persona suelte el ancla en modo edición, el sistema la llevará a la **posición válida más cercana** (imán, en `T_CENTRADO`, instantáneo con movimiento reducido) y la guardará para la orientación actual. El rango de alturas va de `ANCLA_ALTURA_MIN` (piso) al techo en el que el abanico todavía cabe (HM-01).
- **RF3-04** Si durante el modo edición hay un segundo dedo, un cambio de orientación o de sección, el ancla volverá a su posición anterior y no se guardará nada.
- **RF3-05** Cuando el ancla quede del **otro costado**, el sistema cambiará la **mano** (el abanico se refleja hacia el centro) y la guardará (**a decidir**: si hay además un gesto más rápido).
- **RF3-06** Las preferencias de posición (lado y altura) se guardarán **por orientación** (C-18) y sobrevivirán a recargar.
- **RF3-07** En **horizontal**, el ancla estará en la parte inferior de la orientación actual (D-17), en un costado, respetando las áreas seguras laterales (la muesca de la cámara queda a un costado).
- **RF3-08** La primera vez en una orientación, el ancla usará el lado de la otra orientación y la altura de inicio (`ANCLA_ALTURA`).
- **RF3-09** Cuando cambie la orientación, se cancelará la interacción (RF-09) y el ancla se recolocará en la posición de la nueva orientación, sin animación que pase por encima del contenido.
- **RF3-10** La app podrá declarar **zonas reservadas** (un elemento de la página o un rectángulo). El ancla, el abanico abierto, la banda y los avisos **no las taparán**, con un margen `MARGEN_ZONA`.
- **RF3-11** Cuando una zona cambie (tamaño, posición, aparece o desaparece), el ancla se recolocará **en reposo**; nunca durante una interacción.
- **RF3-12** Si la posición guardada tapa una zona, el ancla usará la posición válida más cercana **sin borrar la guardada**: si la zona desaparece, vuelve a la suya.
- **RF3-13** Si no hay ninguna posición válida, el sistema respetará primero las zonas **obligatorias** y podrá tapar las **preferidas** (**a decidir**), y avisará en la consola de desarrollo.
- **RNF3-01** Recalcular las posiciones válidas no redibujará React en cada cuadro (RNF-03): se calcula al cambiar las zonas, la orientación o el tamaño, no mientras se arrastra.

---

## 6. Parámetros nuevos (propuesta; se ajustan con las pruebas)

| Parámetro | Valor inicial | Qué controla |
|---|---|---|
| `MARGEN_ZONA` | 8 px | Espacio mínimo entre el ancla (o su abanico) y una zona reservada |
| `ANCLA_ALTURA_MIN` | el piso actual | Altura mínima del ancla (hoy es interno; pasa a ser parámetro) |
| `ANCLA_ALTURA_H` | 0,30 | Altura de inicio en horizontal (**a decidir**: la misma de vertical no cabe con poco alto) |

Se reutilizan: `T_ESPERA_DESLIZADOR` (entrar al modo edición), `T_CENTRADO` (imán al soltar), `MARGEN_LATERAL`, `MARGEN_INFERIOR`.

---

## 7. Contrato para las apps (propuesta)

```ts
// Zonas reservadas (RF3-10…RF3-13)
useAnchorReservedArea(
  objetivo: RefObject<HTMLElement | null> | { x: number; y: number; width: number; height: number },
  opciones?: { prioridad?: "obligatoria" | "preferida" },   // por defecto "preferida" (a decidir)
): void;

// Mover el ancla (RF3-01): una acción del abanico que la app pone donde quiera
// (por ejemplo, en la pantalla de Ajustes). Marca el modo con `moveAnchor: true`.
AnchorAction.moveAnchor?: boolean;

// Preferencias (RF3-06): por orientación
type AnchorPlacement = { side: "right" | "left"; altura: number };
type AnchorPrefs = { portrait: AnchorPlacement; landscape?: AnchorPlacement };
// La app las guarda; el ancla avisa cuando cambian:
<AnchorProvider prefs={…} onPrefsChange={(prefs) => guardar(prefs)} />
```

`hand` (Fase 1) se deriva del lado: `side === "left"` ⇒ mano izquierda (**a decidir** si se separan).

---

## 8. Ejemplo real: RUTEANDO

Revisado **solo leyendo** en `~/ruteando/client/src` (26-09-2026):

| Pantalla | Esquina | Qué hay | Zona |
|---|---|---|---|
| Mapa | **Abajo a la derecha** | Crédito de **OpenStreetMap** de Leaflet (la licencia obliga a mostrarlo) | **Obligatoria**. Es el mismo costado del ancla con la mano derecha. |
| Mapa | Abajo a la izquierda | Logo "Ruteando" (`fixed bottom-6 left-6`, `map-screen.tsx`) | Preferida. Importa con la mano izquierda. |
| Mapa | Arriba a la izquierda | Botones +/− de zoom de Leaflet (control por defecto) | Preferida. Importa en horizontal, con poco alto. |
| Perfil de negocio | Arriba a la izquierda | Botón Atrás (`fixed left-3 top-3`) | Preferida. |
| Perfil de negocio | Arriba a la derecha | Favorito, o Cuenta si es el dueño (`fixed right-3 top-3`) | Preferida. Importa en horizontal. |
| Todas | Abajo a la derecha | `FloatingActionStack` | **No aplica**: el ancla la reemplaza (D-06). |

En la demo se simulan: el crédito del mapa (abajo a la derecha, obligatoria), el logo (abajo a la izquierda) y los botones de zoom (arriba a la izquierda).

---

## 9. Métricas locales (nuevas)

`anchor_move {desde, hasta, orientacion, lado}` al soltar en modo edición; `anchor_move_cancel {motivo}`; `hand_change {a}`; `orientation {a}`; `zone_conflict {zonas}` cuando no hay posición válida (RF3-13).

---

## 10. Plan de pruebas

1. **Núcleo (Vitest):** posiciones válidas con zonas y áreas seguras; imán; una posición por orientación; conflicto sin lugar; estados `editando`; que el descanso y el joystick no entren al modo edición.
2. **E2E (Playwright, Pixel 7 e iPhone 14, vertical y horizontal):** HU3-01 a HU3-12, solo deslizando.
3. **Manual:** en el Nubia, vertical y horizontal, con una mano: mover el ancla a varias alturas, cambiar de mano, girar el celular; comprobar que el crédito del mapa nunca queda tapado.

## 11. Preguntas abiertas

En `decisiones-pendientes.md`.

## 12. Hallazgos de la prueba manual

(Vacío.)
