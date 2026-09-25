# Decisiones pendientes — Fase 1

Puntos que necesitan tu decisión. Al decidirlos pasan a `design.md` §0 y a `spec.md`, y se borran de aquí.

---

## HM-08 · Acciones propias de cada capa (integra HM-06)

**Ya decidido por ti:** con una capa abierta, el abanico = **"Cerrar" a 90° + las acciones de la capa**. Las de la pantalla de fondo se ocultan y vuelven al cerrar, en sus mismas posiciones. Sin acciones de capa, solo "Cerrar". `useAnchorLayer` acepta `AnchorAction[]`.

Encontré **tres choques** con decisiones anteriores. Para cada uno, mi propuesta:

### Pregunta 1 — ¿Qué pasa con "Deshacer" (C-21) mientras hay una capa abierta?
Ejemplo: en el producto marcas "no disponible" (aparece el aviso de 5 s) y enseguida abres "Editar producto". Las acciones del producto están ocultas; solo se ve la capa.

| Opción | Qué pasa | A favor | En contra |
|---|---|---|---|
| **A (propuesta)** | "Deshacer" reemplaza a la **prioridad 1 de la capa** (misma regla de C-21: "prioridad 1 del abanico que se ve") | Se puede deshacer **solo deslizando** también con la capa abierta (D-15, HU-09) | Oculta una acción de la capa hasta 5 s |
| B | Con una capa abierta, "Deshacer" no está en el abanico; solo el aviso (tocarlo) | La capa queda intacta | Mientras dura la capa, deshacer exige un toque (choca con D-15) |

### Pregunta 2 — ¿Qué muestra el centro del ancla (D-09) con una capa abierta?
En HM-03 dijimos "una capa no es una sección: el centro sigue con el ícono de la sección". Con HM-08 la capa tiene sus propias acciones: para el pulgar es un "lugar" nuevo.

| Opción | Qué pasa |
|---|---|
| **A (propuesta)** | La capa declara (opcional) **ícono y nombre**. Con la capa abierta, el **centro muestra el ícono de la capa**, el nombre accesible pasa a "Menú, {capa}", y la banda en la zona muerta dice el nombre de la capa. Sin ícono o nombre, se usan los de la sección. Refuerza D-09 ("dónde estás"). |
| B | El centro sigue mostrando la sección (como en HM-03). Más simple, pero el abanico ya no corresponde a lo que dice el centro. |

*(Si eliges A, cambia lo dicho en HM-03 sobre el centro: lo registro en §12.)*

### Pregunta 3 — ¿"Ocultar teclado" lo pone el ancla o la capa? (detalle de HM-06)
En HM-06, la propuesta A aceptada era un "modo escritura" **del ancla**: con el teclado abierto, siempre "Cerrar" a 90° y "Ocultar teclado" a 180°, en cualquier app. En HM-08 lo pones como **acción de la capa de búsqueda** (junto con "Borrar texto").

| Opción | Qué pasa | A favor | En contra |
|---|---|---|---|
| **A (propuesta)** | **Lo pone el ancla**, siempre que haya un teclado abierto, **fijo a 180°** (reemplaza lo que haya ahí, como "Cerrar" a 90°). La capa solo declara lo suyo ("Borrar texto"). Con teclado cerrado, desaparece y vuelve lo de 180°. | Cumple D-15 en **cualquier** campo de cualquier app, aunque la app se olvide; posición fija para memorizar (HM-06 A) | Con 5 opciones, esconde una acción de la capa mientras el teclado esté abierto |
| B | Lo declara cada capa, con su prioridad (como en tu lista de HM-08) | Más control para la app | Un campo fuera de una capa, o una app que lo olvide, deja el teclado sin forma de bajarlo deslizando (choca con D-15); la posición varía entre capas |

Con A, la búsqueda quedaría así:
- **Teclado abierto:** Cerrar 90° · Borrar texto (diagonal) · Ocultar teclado 180°.
- **Teclado cerrado:** Cerrar 90° · Escribir · Borrar texto.

### Otros detalles (sin choque, los aplico así salvo que digas otra cosa)
- **Tope:** "Cerrar" + acciones de la capa ≤ 5 → `validateScreen` también valida las capas (máx. 4 acciones propias).
- **Capas apiladas:** se ven las acciones de la capa de **arriba**.
- **Bienvenida (HU-12) y métricas:** las acciones de capa cuentan igual que las de pantalla (usos, `execute`).
- **Ids:** las acciones de capa no pueden usar ids reservados (`atras`, `cerrar`, `deshacer`, `ocultar-teclado`).
- **Íconos nuevos** en `semantic-icons.ts` de la demo: Ocultar teclado, Borrar texto, Escribir, Ordenar, Filtrar, Ver en el mapa (se eligen sin repetir significados, con la prueba de RNF-09).
