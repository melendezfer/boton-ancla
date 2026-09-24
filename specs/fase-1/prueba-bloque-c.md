# Prueba del Bloque C — el ancla responde al dedo (T-15 a T-23)

Primera vez que el ancla funciona de verdad. Esta guía dice qué probar en el PC y en el celular, qué debería pasar y qué no esperar todavía. Para levantar la demo y la red, ver `prueba-t12.md` y `prueba-bloque-b.md`.

---

## 0. Estado

| Tarea | Qué quedó | Pruebas automáticas |
|---|---|---|
| Decisiones | `ANCLA_ALTURA` = 0,38 (HM-01) y banda de etiqueta (HM-02), en spec v0.6 | Núcleo |
| T-15 | Ancla translúcida en reposo, con el ícono de la sección | E2E |
| T-16 | Gesto: abrir, preseleccionar, cambiar sin soltar, cancelar, ejecutar, modo experto; banda de etiqueta | E2E |
| T-17 | Descanso del pulgar | E2E |
| T-18 | Modo toque, con velo que no deja pasar toques al contenido | E2E |
| T-19 | Deshacer (aviso + "Deshacer" en el abanico), confirmar irreversibles | E2E |
| T-20 | Cancelar por segundo dedo, orientación o cambio de sección; ocultar con teclado | E2E |
| T-21 | Teclado y movimiento reducido | E2E |
| T-22 | Mano izquierda | E2E |
| T-23 | Bienvenida: demostración inicial y pista "Desliza hacia una opción" | E2E |

Totales: **380** pruebas del núcleo, **24** de la demo y **129** E2E (Pixel 7 + iPhone 14), todas en verde; 1 se salta a propósito.

Además revisé capturas en Pixel 7: el ancla y el abanico se ven como se esperaba.

---

## 1. Levantar

Si la demo ya está corriendo, **recarga la página** (el adaptador es nuevo: mejor recarga completa).
Si no: en WSL, `cd ~/boton-ancla && npm run dev`, y espera `✓ Ready`.

- PC: `http://localhost:3002`
- Celular: `http://192.168.1.7:3002` (si no carga: `npm run lan`, ver `prueba-t12.md` §3).

> **La primera vez** verás la **demostración**: una opción sale del ancla y vuelve. Es la bienvenida (HU-12); no se repite. Para verla de nuevo: Ajustes → "Repetir la bienvenida".

---

## 2. Qué probar (celular, una mano)

Marca cada punto. Entre paréntesis, la historia o requisito que cubre.

### 2.1 Gesto (lo principal)
- [ ] **Presiona el ancla y desliza** hacia una opción: el abanico aparece desde el centro; la opción bajo tu dirección se **agranda en violeta**, el **centro muestra su ícono** y **arriba del abanico** aparece su nombre en una banda blanca (HU-01, D-09, HM-02).
- [ ] **Suelta** sobre "Buscar": se abre la búsqueda **con el teclado** y el ancla se oculta mientras el teclado está abierto (HU-01, RF-13, L-04). Cierra la búsqueda: el ancla vuelve.
- [ ] **Sin levantar el dedo**, recorre las opciones: la preselección, el ícono del centro y la banda cambian con el dedo (HU-02). En Android debería **vibrar** apenas en cada cambio; en iPhone no (D-02).
- [ ] **Vuelve al centro y suelta**: no pasa nada (HU-03). La banda muestra "Mapa" mientras estás en el centro.
- [ ] **Desliza hacia abajo o hacia el borde** (fuera del arco) y suelta: no pasa nada (C-08).
- [ ] **Modo experto**: un deslizamiento rápido en la dirección de una opción, sin mirar, la ejecuta (HU-06).
- [ ] Presionar el ancla y deslizar **no mueve el mapa**; arrastrar el mapa pasando por encima del ancla **no la activa** (HU-13).

### 2.2 Alcance con una mano (lo que pediste evaluar aquí)
Con el ancla al 38 %:
- [ ] ¿Llegas cómodo a **las 4 opciones del Mapa** y a **las 5 del Perfil** (visitante) sin cambiar la posición de la mano?
- [ ] ¿Cuál cuesta más: la de **arriba** (90°) o la de la **izquierda** (180°)?
- [ ] En el detalle de producto (rol Dueño), ¿puedes **deslizar más allá** de "Eliminar" (anillo exterior, 180°) cómodamente?

Si algo cuesta, ajusta la altura en Ajustes y anota el porcentaje: puede salir HM-03 (radio del arco, altura o P-05).

### 2.3 Descanso
- [ ] Deja el pulgar **quieto** sobre el ancla ~½ s: aparece un **anillo suave** alrededor y **no** se abre nada (HU-04).
- [ ] Suelta: no pasa nada. Repite y, desde el descanso, **desliza**: el menú se abre normal.
- [ ] Mientras lees el perfil con el pulgar apoyado, un temblor pequeño **no** debería abrir el menú (C-07).

### 2.4 Modo toque
- [ ] **Toca** el ancla rápido: el menú queda abierto (HU-05).
- [ ] **Apoya** el dedo sobre una opción: la banda muestra su nombre **antes de soltar** (HM-02). Suelta ahí: se ejecuta. Si en cambio arrastras fuera antes de soltar: no pasa nada (C-06).
- [ ] Con el menú abierto, **toca fuera** (por ejemplo sobre un pin): el menú se cierra y el pin **no** se abre (RF-11).
- [ ] Toca el centro: se cierra. Déjalo abierto sin tocar nada: a los **4 s** se cierra solo.

### 2.5 Acciones sensibles (Ajustes → Rol: Dueño → Carta → un producto)
- [ ] **Marcar no disponible**: se aplica al instante (insignia "No disponible") y aparece arriba del abanico el aviso **"Marcado no disponible · Deshacer"** durante 5 s (HU-07).
- [ ] Mientras está el aviso, abre el ancla: donde estaba **Editar** ahora está **Deshacer**; nada más se movió (C-21). Desliza a Deshacer: vuelve a "Disponible".
- [ ] Repite y **toca el aviso**: también deshace (RF-08).
- [ ] Desliza hasta **Eliminar** y suelta: **no** se elimina; el aviso dice "Desliza más allá para confirmar". La banda ya lo avisaba antes de soltar (HU-08).
- [ ] Desliza hasta Eliminar y **sigue más allá** del círculo punteado; la banda cambia a "suelta para confirmar" y el anillo se rellena; suelta: se elimina y vuelves a la carta (HU-08).
- [ ] En **modo toque**, toca Eliminar: aparece el botón **"Confirmar: Eliminar"**; solo así se elimina.
- [ ] En "Empanada de pipián" (no disponible), "Marcar no disponible" se ve atenuada; soltar sobre ella no hace nada (C-09).

### 2.6 Resto
- [ ] **Mano izquierda** (Ajustes): el ancla pasa a la izquierda y todo se refleja; "Atrás" sigue arriba (HU-11).
- [ ] **Navegación**: en el perfil, "Carta" lleva a la carta y el centro cambia al ícono de Carta; "Compartir" no cambia el ícono (HU-10). "Atrás" (arriba) vuelve.
- [ ] **Segundo dedo** durante el gesto: se cancela (RF-09).
- [ ] **Sin lupa ni selección de texto** en iPhone al mantener presionado (RNF-02, L-05).
- [ ] **Gestos del sistema** cerca del ancla: el "atrás" de Android y la barra de inicio de iOS no se confunden con el ancla (L-02).
- [ ] **Legibilidad**: cambia el fondo del mapa (Ajustes → Foto / Oscuro): el ancla en reposo, ¿se distingue?
- [ ] **PC con teclado**: Tab hasta el ancla, Enter abre, flechas mueven, Enter ejecuta, Escape cierra (RNF-05).

---

## 3. Qué NO esperar todavía

| No esperes | Cuándo |
|---|---|
| Pantalla de **Métricas** con los eventos y exportar JSON (los eventos ya se generan, pero la demo todavía no los guarda) | T-25 |
| Prueba E2E que recorre **todas** las acciones solo deslizando (HU-09 completo) | T-26 |
| Lista de prueba manual formal con resultados de 3 personas | T-27 |
| Que el Documento 8 defina más campos de exportación | C-20 |

T-24 ("ancla en todas las pantallas") quedó casi hecho de paso: todas las pantallas de §8 ya están conectadas. En T-24 solo faltan sus E2E (HU-10 completa).

---

## 4. Decisiones menores que tomé en este bloque (dime si alguna no va)

1. **API**: `AnchorProvider` recibe `icons: { back, undo }`, porque el ancla dibuja "Atrás" y "Deshacer" pero `AnchorScreen` no trae sus íconos (spec §7 actualizada).
2. **Banda con irreversibles**: agrega "· desliza más allá para confirmar" y, ya armada, "· suelta para confirmar".
3. **Descanso**: el ancla sigue translúcida con un anillo sutil; el aspecto sólido/violeta queda para armar y para el menú abierto.
4. **Avisos** (deshacer, bloqueado, error, "Confirmar"): van justo encima de la banda, fuera del alcance del pulgar.
5. **Error de una acción asíncrona** (C-19): aviso "No se pudo completar la acción". Está implementado pero **sin prueba E2E**, porque ninguna acción de la demo es asíncrona.
6. **Texto raro conocido**: la opción deshabilitada "Marcar no disponible" se lee "Marcar no disponible · no disponible". Es la regla general de C-09 aplicada a una etiqueta que ya dice "no disponible". Si molesta, se le puede dar otra etiqueta cuando está deshabilitada.

---

## 5. Qué contarme
1. Lo del punto 2.2 (alcance) con el porcentaje de altura, si lo cambiaste.
2. Qué se sintió **lento, confuso o incómodo** (spec §10.3).
3. Cualquier punto de la lista que **no** se comportó como dice, con pantalla y dispositivo.
4. Si alguna de las decisiones del punto 4 no te convence.
