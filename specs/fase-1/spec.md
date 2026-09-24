# Botón-ancla — Especificación Fase 1: núcleo del gesto

Versión 0.1 · Primera app base: RUTEANDO · Destino: componente integrable en cualquier app

> Esta spec es la fuente de verdad. Si el código y la spec no coinciden, se corrige uno de los dos a propósito, nunca en silencio.

---

## 0. Alcance

### Incluye (Fase 1 = Fases 1 y 2 del Documento 7)
- Ancla en reposo (translúcida), armado, descanso, abierta y ejecución.
- Tres formas de uso que conviven sin configurar nada: **gesto**, **toque** y **experto**.
- Abanico de hasta **5 opciones** en la esquina inferior derecha o izquierda.
- Selección por ángulo, zona muerta central y cancelación por gesto inverso.
- Acciones sensibles sin retraso: deshacer y deslizar más allá.
- Ícono central que muestra la sección actual y anticipa la opción preseleccionada.
- Bienvenida mínima con etiquetas durante los primeros usos.
- Accesibilidad básica: ARIA, teclado, `prefers-reduced-motion`.
- Registro local de métricas para las pruebas del Documento 8.
- App demo con pantallas simuladas de RUTEANDO para probar en PC y teléfono.

### Fuera de Fase 1 (y por qué)
| Queda fuera | Fase | Motivo |
|---|---|---|
| Carrusel, submenús y más de 5 opciones | 4 | Primero se valida el abanico básico. |
| Desplazar contenido desde el modo descanso | 2-exp | Cambia el significado de "descanso + mover"; se decide con datos de las pruebas. |
| Mover el ancla arrastrándola | 3 | Choca con el descanso (ver D-12). En Fase 1 el lado se elige en ajustes. |
| Zonas prohibidas registradas por la app | 3 | En Fase 1 solo se respetan áreas seguras y teclado. |
| Orientación horizontal | 3 | La posición se guarda por orientación, pero solo se prueba en vertical. |
| Aprendizaje y ajuste automático | 5 | Documento 7: primero la interacción, después la inteligencia. |
| Adaptadores Web Component y React Native | 6 | En Fase 1 solo existen el núcleo y el adaptador React. |

---

## 1. Decisiones cerradas

| ID | Decisión | Origen |
|---|---|---|
| D-01 | El sistema es un componente dentro de cada app, no una superposición del sistema operativo. | C1 |
| D-02 | La vibración es un extra que solo funciona en Android. Toda señal debe funcionar también solo con lo visual. | C2 |
| D-03 | Las opciones se distribuyen en un **arco alcanzable**, nunca en un círculo completo. | C3 |
| D-04 | El reposo es un fondo translúcido con desenfoque y un ícono con contraste pleno (mínimo 3:1). | C4 |
| D-05 | Se aprovechan los antecedentes (marking menus, zona del pulgar). El criterio es facilidad, agilidad y comodidad. | C5 |
| D-06 | En RUTEANDO el ancla **reemplaza** la pila de círculos de la derecha. Las acciones cambian según la pantalla: por ejemplo, en el mapa no existe "eliminar". | C6 |
| D-07 | El gesto y el toque conviven; el sistema los distingue por movimiento y tiempo. | H1 |
| D-08 | Modo experto: soltar fuera de la zona muerta ejecuta según la dirección, sin esperar la animación. | H2 |
| D-09 | El centro muestra **dónde está el usuario en la app** (ícono de sección). Mientras hay una preselección, anticipa el ícono de esa opción. | H3, H9 |
| D-10 | Cancelar es lo **inverso de activar**: volver al centro y soltar. La app puede habilitar además una opción fija de "Atrás". | H4 |
| D-11 | **Modo descanso**: dejar el pulgar quieto sobre el ancla no abre nada. Sirve para sostener el teléfono mientras se lee. | H5, H6 |
| D-12 | Como mantener quieto significa descanso, **mover el ancla no puede activarse manteniendo presionado**. En Fase 1 se hace desde ajustes; el arrastre llega en la Fase 3. | H12 (cambia mi propuesta anterior) |
| D-13 | Del estado sólido se vuelve al translúcido por gesto (cancelar o ejecutar) o por tiempo. Mientras está abierto, el ancla capta los toques de su zona para que no pasen al contenido. | H7 |
| D-14 | Las acciones sensibles no agregan esperas: las reversibles se ejecutan y ofrecen deshacer; las irreversibles se confirman deslizando más allá de la opción. | H8 |
| D-15 | **Todo debe poder hacerse solo deslizando**, sin toques. El toque es una alternativa, nunca un requisito. | H16 |
| D-16 | Las formas de presentar las opciones (abanico, carrusel, submenú) serán **modos que el usuario elige**. En Fase 1 solo existe el abanico. | H16 |
| D-17 | El ancla siempre queda en la parte inferior de la orientación actual, del lado que elija el usuario, y por encima de las hojas inferiores. | H14, H15 |
| D-18 | El núcleo es TypeScript puro sin React (headless); cada framework se conecta con un adaptador. | H21 |
| D-19 | El componente no trae colores fijos: recibe los tokens de la app. En RUTEANDO: `terracota`, `surface`, `border`, `text`, `text-muted`. | H23 |

### Desviación consciente del Documento 1
El Documento 1 §10 pide un centro 2–3 veces mayor que las opciones. Con opciones de 44 px, que es el mínimo táctil, el centro mediría entre 88 y 132 px y taparía contenido. Por eso la Fase 1 usa **64 px para el centro y 44 px para las opciones (1,45×)**, y la jerarquía se refuerza con color y relleno. Se revisará con las pruebas.

---

## 2. Glosario
- **Ancla:** el botón circular desde el que empieza todo.
- **Zona muerta:** círculo alrededor del centro del ancla donde no se preselecciona nada.
- **Sector:** porción angular del arco que corresponde a una opción.
- **Preselección:** la opción que se ejecutaría si el usuario soltara en ese momento.
- **Anillo exterior:** distancia a partir de la cual se confirma una acción irreversible.
- **Sección:** la pantalla o lugar de la app donde está el usuario (mapa, perfil, carta…).

---

## 3. Máquina de estados

```
reposo ──pointerdown en ancla──▶ armado
armado ──se mueve > UMBRAL_MOV antes de T_DESCANSO──▶ abierto_gesto
armado ──suelta con movimiento < UMBRAL_MOV y antes de T_TOQUE──▶ abierto_toque
armado ──quieto durante T_DESCANSO──▶ descanso
armado ──suelta entre T_TOQUE y T_DESCANSO sin moverse──▶ reposo (sin efecto)
descanso ──suelta──▶ reposo (sin efecto)
descanso ──se mueve > UMBRAL_MOV──▶ abierto_gesto        (Fase 1; en 2-exp podría ser desplazamiento)
abierto_gesto ──se mueve──▶ abierto_gesto (actualiza la preselección)
abierto_gesto ──suelta en zona muerta──▶ cancelado
abierto_gesto ──suelta sobre una opción normal o reversible──▶ ejecutando
abierto_gesto ──suelta sobre irreversible sin pasar el anillo exterior──▶ bloqueado_sensible
abierto_gesto ──irreversible y cruza el anillo exterior──▶ confirmacion_armada
confirmacion_armada ──suelta──▶ ejecutando
confirmacion_armada ──vuelve dentro del anillo──▶ abierto_gesto
abierto_toque ──toca una opción──▶ ejecutando | confirmacion_toque (si es irreversible)
abierto_toque ──pointerdown en el centro y desliza──▶ abierto_gesto
abierto_toque ──toca el centro, toca fuera o pasa T_INACTIVO──▶ cancelado
confirmacion_toque ──toca "Confirmar"──▶ ejecutando
confirmacion_toque ──toca fuera o pasa T_INACTIVO──▶ cancelado
bloqueado_sensible ──▶ reposo + aviso "Desliza más allá para confirmar"
ejecutando ──▶ reposo (+ aviso con deshacer si es reversible)
cancelado ──▶ reposo
CUALQUIER ESTADO ──segundo dedo | pointercancel | cambio de orientación | la app cambia de sección──▶ cancelado
```

**Regla:** toda transición es una función pura `(estado, evento) → estado`. No se permiten efectos secundarios dentro de la máquina; estos se ejecutan en el adaptador.

---

## 4. Historias de usuario

**HU-01 — Ejecutar con un solo gesto**
Como comensal con el teléfono en una mano, quiero presionar, deslizar hacia una opción y soltar, para actuar sin cambiar la posición de la mano.
```gherkin
Dado el ancla en reposo abajo a la derecha en la sección "Mapa"
Cuando presiono el ancla, deslizo hacia arriba y a la izquierda hasta la opción "Buscar" y suelto
Entonces se abre el campo de búsqueda con el teclado
Y el ancla vuelve a reposo en menos de 200 ms
```

**HU-02 — Cambiar de opción sin levantar el dedo**
```gherkin
Dado el menú abierto en modo gesto con "Buscar" preseleccionada
Cuando deslizo hacia el sector de "Favoritos" sin levantar el dedo
Entonces "Favoritos" queda preseleccionada, se agranda y el centro anticipa su ícono
Y "Buscar" vuelve a su tamaño normal
```

**HU-03 — Cancelar con el gesto inverso**
```gherkin
Dado el menú abierto con una opción preseleccionada
Cuando regreso el dedo a la zona muerta y suelto
Entonces no se ejecuta nada y el ancla vuelve a reposo
```

**HU-04 — Descansar el pulgar**
Como usuario que lee mientras sostiene el teléfono con una mano, quiero apoyar el pulgar en el ancla sin que se abra nada.
```gherkin
Dado el ancla en reposo
Cuando pongo el pulgar sobre el ancla y lo dejo quieto 400 ms o más
Entonces el ancla muestra un anillo sutil de "descanso" y no aparece ninguna opción
Y al soltar no se ejecuta nada
Y si desde el descanso deslizo, el menú se abre en modo gesto
```

**HU-05 — Modo toque**
```gherkin
Dado el ancla en reposo
Cuando toco el ancla rápido sin moverme
Entonces el menú queda abierto
Y al tocar una opción esta se ejecuta
Y si pasan 4 s sin actividad el menú se cierra
```

**HU-06 — Modo experto**
```gherkin
Dado que conozco la posición de "Buscar"
Cuando presiono y deslizo rápido hacia su dirección y suelto antes de que termine la animación
Entonces se ejecuta "Buscar"
```

**HU-07 — Acción reversible**
```gherkin
Dado el perfil de mi negocio (dueño)
Cuando ejecuto "Marcar no disponible" desde el ancla
Entonces la acción se aplica de inmediato
Y aparece un aviso "Marcado no disponible · Deshacer" durante 5 s
```

**HU-08 — Acción irreversible sin retraso**
```gherkin
Dado el detalle de un producto propio con la opción "Eliminar"
Cuando deslizo hasta "Eliminar" y suelto
Entonces no se elimina y aparece "Desliza más allá para confirmar"
Cuando deslizo hasta "Eliminar", sigo más allá del anillo exterior y suelto
Entonces se elimina el producto
```

**HU-09 — Solo deslizar**
Como usuario que no puede dar toques, quiero usar todas las funciones solo deslizando.
```gherkin
Dado cualquier pantalla de la demo
Entonces cada acción del ancla, incluida la confirmación de irreversibles, se puede completar sin ningún toque
```

**HU-10 — Saber dónde estoy**
```gherkin
Dado que ejecuto "Carta" desde el perfil de un negocio
Cuando la app cambia a la sección "Carta"
Entonces el ancla muestra el ícono de Carta en reposo
Y al ejecutar "Compartir" el ícono del centro no cambia, porque no cambia la sección
```

**HU-11 — Mano izquierda**
```gherkin
Dado que en ajustes elijo "Mano izquierda"
Entonces el ancla se ubica abajo a la izquierda y el abanico se refleja
Y cada opción conserva su misma posición relativa al pulgar
```

**HU-12 — Primeros usos**
```gherkin
Dado que es la primera vez que abro la app
Entonces el ancla hace una demostración breve (una opción sale y vuelve)
Y cada opción muestra su etiqueta durante sus primeros 5 usos
```

**HU-13 — No interferir con el mapa**
```gherkin
Dado que presiono el ancla y deslizo
Entonces el mapa no se desplaza
Dado que arrastro el mapa y mi dedo pasa sobre el ancla
Entonces el ancla no se activa
```

---

## 5. Requisitos (formato EARS)

### Funcionales
- **RF-01** Cuando ocurra `pointerdown` sobre el ancla, el sistema debe capturar el puntero (`setPointerCapture`) y pasar a `armado`.
- **RF-02** Mientras esté en `abierto_gesto`, si la distancia al centro es menor que `R_MUERTA`, el sistema no debe tener preselección.
- **RF-03** Mientras esté en `abierto_gesto`, si la distancia supera `R_MUERTA`, el sistema debe preseleccionar la opción cuyo sector contenga el ángulo del dedo.
- **RF-04** Cuando el ángulo cruce el borde entre dos sectores, el sistema debe cambiar la preselección solo si lo supera en al menos `HISTERESIS` grados.
- **RF-05** Los sectores de los extremos deben extenderse hasta ±`EXT_EXTREMOS` grados fuera del arco, para tolerar movimientos imprecisos.
- **RF-06** Cuando cambie la preselección, el sistema debe agrandar la opción (`ESCALA_PRESEL`), mostrar la etiqueta **por encima del dedo** y, si hay soporte, vibrar `VIB_MS`.
- **RF-07** Si la opción preseleccionada es `irreversible`, el sistema debe dibujar el anillo exterior y exigir cruzarlo para confirmar.
- **RF-08** Si la opción ejecutada es `reversible`, el sistema debe mostrar un aviso con "Deshacer" durante `T_DESHACER`.
- **RF-09** Mientras haya un segundo puntero, un `pointercancel` o un cambio de orientación, el sistema debe cancelar.
- **RF-10** Cuando la app cambie de sección, el sistema debe actualizar el ícono central y cancelar cualquier interacción abierta.
- **RF-11** Mientras el menú esté abierto, los toques dentro del área del menú no deben llegar al contenido. En modo toque, un toque fuera cierra el menú y tampoco llega al contenido.
- **RF-12** El sistema debe calcular el arco dentro del viewport, restando `MARGEN_BORDE` y `env(safe-area-inset-*)`. Ninguna opción puede quedar fuera de pantalla.
- **RF-13** Mientras el teclado esté abierto (`visualViewport`), el sistema debe ubicar el ancla sobre el teclado o bien ocultarla (valor por defecto: ocultar).
- **RF-14** El sistema debe mantener el ancla por encima de las hojas inferiores de la app. En RUTEANDO, su `z-index` debe ser mayor que `z-[1000]`.

### No funcionales
- **RNF-01** Solo deslizar: ninguna función puede requerir un toque (D-15).
- **RNF-02** Ancla y opciones con `touch-action:none`, `user-select:none`, `-webkit-touch-callout:none`, y `contextmenu` bloqueado sobre el ancla.
- **RNF-03** Animaciones solo con `transform` y `opacity`, a 60 fps en gama baja. `backdrop-blur` solo en el ancla, nunca en las opciones que se mueven.
- **RNF-04** Con `prefers-reduced-motion`, sin animaciones de movimiento; solo cambios de opacidad.
- **RNF-05** El ancla es un `<button aria-haspopup="menu" aria-expanded>` cuyo nombre accesible es "Menú, sección {sección}". Las opciones son `role="menuitem"`, y con teclado se navega con flechas, Enter y Escape.
- **RNF-06** Contraste: ícono ≥ 3:1 sobre el fondo real en reposo, y texto de etiquetas ≥ 4.5:1.
- **RNF-07** El núcleo no importa React ni el DOM; debe poder probarse en Node.
- **RNF-08** Las métricas se guardan solo en el dispositivo, sin datos anatómicos. Solo la demo permite exportarlas.
- **RNF-09** Cada ícono tiene un único significado. En RUTEANDO se registra en `lib/icons/semantic-icons.ts`.

---

## 6. Parámetros iniciales (ajustables con las pruebas)

| Parámetro | Valor | Nota |
|---|---|---|
| `D_REPOSO` | 52 px | Diámetro en reposo |
| `D_ACTIVO` | 64 px | Diámetro cuando está activo |
| `D_OPCION` | 44 px | Mínimo táctil |
| `ESCALA_PRESEL` | 1.25 | Escala de la opción preseleccionada |
| `OPACIDAD_REPOSO` | fondo 60% + desenfoque | El ícono siempre al 100% |
| `MARGEN_BORDE` | 16 px + área segura | Evita los gestos de borde del sistema |
| `R_MUERTA` | 24 px | Radio de la zona muerta |
| `R_ARCO` | 100 px | Distancia del centro a las opciones |
| `R_EXTERIOR` | `R_ARCO` + 48 px | Confirmación de irreversibles |
| `ARCO` | 90° → 180° (derecha); espejo para izquierda | De "arriba" a "izquierda" |
| `EXT_EXTREMOS` | 20° | Tolerancia de los sectores extremos |
| `HISTERESIS` | 8° | Evita parpadeo entre vecinas |
| `UMBRAL_MOV` | 10 px | Distingue toque de movimiento |
| `T_TOQUE` | 250 ms | Duración máxima de un toque |
| `T_DESCANSO` | 400 ms | Tiempo quieto para entrar en descanso |
| `T_INACTIVO` | 4 s | Cierre automático del modo toque |
| `T_DESHACER` | 5 s | Duración del aviso con deshacer |
| `T_ANIM` | 140 ms | Apertura y cierre |
| `VIB_MS` | 10 ms | Solo Android |
| `USOS_ETIQUETA` | 5 por opción | Bienvenida |
| `MAX_OPCIONES` | 5 | Fase 1 |

Distribución: las opciones se reparten en el arco ordenadas por `priority`. La prioridad 1 va en la **diagonal**, que es la posición más cómoda. Si la app habilita "Atrás", ocupa siempre el extremo **"arriba"** del arco, pegado al borde, para que sea fácil de memorizar.

---

## 7. Contrato para las apps (API)

```ts
// núcleo: sin React
export type AnchorIcon = unknown; // el adaptador decide (en RUTEANDO: componente de Phosphor)

export type AnchorAction = {
  id: string;
  icon: AnchorIcon;
  label: string;                        // etiqueta y nombre accesible
  onSelect: () => void | Promise<void>;
  priority?: number;                    // 1 = posición más cómoda
  kind?: "normal" | "reversible" | "irreversible";
  onUndo?: () => void;                  // obligatorio si kind = "reversible"
  undoMessage?: string;                 // "Marcado no disponible"
  disabled?: boolean;
};

export type AnchorScreen = {
  id: string;                           // "mapa", "perfil-negocio"
  sectionIcon: AnchorIcon;              // lo que muestra el centro (D-09)
  sectionLabel: string;
  back?: { onSelect: () => void };      // habilita la opción fija "Atrás"
  actions: AnchorAction[];              // máximo 5 en Fase 1, contando "Atrás"
};

export type AnchorPrefs = { hand: "right" | "left" };

// núcleo
createAnchorMachine(params?: Partial<Params>): Machine;
computeFanLayout(input: { anchor: Point; viewport: Rect; safeArea: Insets;
  count: number; hand: "right" | "left"; params: Params }): Slot[];
resolveSelection(input: { center: Point; pointer: Point; slots: Slot[];
  previous?: string; params: Params }): { id?: string; beyondOuter: boolean };

// adaptador React
<AnchorProvider prefs={...} theme={...} onEvent={logMetric}>…</AnchorProvider>
useAnchorScreen(screen: AnchorScreen): void;
```

---

## 8. Ejemplo de pantallas en RUTEANDO (para la demo)

| Sección (centro) | Acciones (prioridad) | Tipo |
|---|---|---|
| Mapa | Buscar (1), Mi ubicación (2), Ofertas cerca `Tag` (3), Favoritos (4) | normal |
| Perfil de negocio (visitante) | Carta `BookOpen` (1), Cómo llegar (2), Favorito (3), Compartir (4), Atrás | normal |
| Perfil de negocio (dueño) | Agregar plato (1), Marcar no disponible (2, reversible), Editar (3), Atrás | mixto |
| Detalle de producto (dueño) | Editar (1), Eliminar (2, irreversible), Atrás | mixto |

`Tag` y `BookOpen` ya tienen significado en `semantic-icons.ts`. Los íconos nuevos (buscar, ubicación, favorito, compartir, editar, eliminar, atrás, cómo llegar) **deben registrarse antes de integrarse**, para respetar la regla de un significado por ícono.

---

## 9. Métricas locales (Documento 8)

Eventos que se registran: `open {mode: gesto|toque|experto}`, `preselect {id}`, `execute {id, ms, pathPx, expert}`, `cancel {reason}`, `rest_enter`, `sensitive_blocked {id}`, `undo {id}`.
La demo incluye una pantalla para exportar a JSON con los campos del Documento 8 §13: versión, dispositivo, mano, posición, número de opciones, acción, tiempo, errores y observaciones.

---

## 10. Plan de pruebas

1. **Unitarias (Vitest, núcleo):** todas las transiciones de §3; `computeFanLayout` con anclas en ambos lados y pantallas de 320, 375, 412 y 430 px sin opciones fuera de pantalla; `resolveSelection` con zona muerta, histéresis, sectores extremos y anillo exterior.
2. **E2E (Playwright, emulación táctil, Pixel 7 e iPhone 14):** HU-01 a HU-13.
3. **Manual obligatoria en PC y teléfono real**, con la demo abierta en la red local:
   - [ ] Abrir y ejecutar las 4–5 opciones de cada pantalla con una sola mano.
   - [ ] Cambiar de opción sin soltar; cancelar volviendo al centro.
   - [ ] Descansar el pulgar mientras se lee y confirmar que no se abre nada.
   - [ ] Hacer todo **solo deslizando**, sin ningún toque.
   - [ ] Probar el modo experto con deslizamientos rápidos sin mirar.
   - [ ] Irreversible: soltar sobre "Eliminar" no elimina; deslizar más allá sí.
   - [ ] Probar el gesto "atrás" de Android y la barra de inicio de iOS cerca del ancla, sin conflictos.
   - [ ] Mantener presionado sin que aparezca la lupa ni la selección de texto de iOS.
   - [ ] Probar con mano izquierda.
   - [ ] Revisar la legibilidad del ancla translúcida sobre el mapa claro y sobre fotos.
   - [ ] Anotar qué se sintió lento, confuso o incómodo.

**Criterio de salida de la Fase 1:** todas las pruebas pasan, la lista manual está completa y hay registro de al menos 3 personas (incluyendo una que use solo deslizamiento).

---

## 11. Preguntas abiertas (para las siguientes fases)
- **P-01** ¿"Descanso + mover" debe desplazar el contenido en lugar de abrir el menú? Se decide con los datos de la Fase 1.
- **P-02** Con el teclado abierto, ¿el ancla se oculta o sube sobre el teclado?
- **P-03** ¿Qué gesto rápido debería servir para cambiar de mano a quien usa ambas?
- **P-04** ¿Cómo se ofrecerán los modos (abanico, carrusel, submenú) al usuario en la Fase 4?
