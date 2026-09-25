# Decisiones pendientes — Fase 1

Puntos que necesitan tu decisión. Al decidirlos pasan a `design.md` §0 y a `spec.md`, y se borran de aquí.

---

## HM-03 · Cerrar con el ancla lo que se abrió encima (hallazgo de prueba manual)

**Tu propuesta:** distinguir **navegar** ("Atrás") de **capa abierta encima** ("Cerrar"). Con una capa abierta, la posición fija de 90° muestra "Cerrar" (ícono X) en lugar de "Atrás"; el botón atrás del sistema también cierra la capa; y la app declara y quita la capa con su `onClose`.

### 1. ¿Choca con decisiones anteriores?

| Decisión | ¿Choca? | Cómo se resuelve |
|---|---|---|
| **D-10** ("Atrás" siempre arriba, 90°) | No, la refuerza | Lo que está a 90° pasa a ser **"volver un paso"**: cerrar la capa si hay una y, si no, navegar hacia atrás. El mismo gesto hacia arriba sirve siempre para retroceder. |
| **C-22** (Atrás arriba aunque sea la única) | No | Con una capa abierta, "Cerrar" ocupa ese mismo lugar. |
| **C-21** (Deshacer reemplaza a la prioridad 1, nada más se mueve) | No | "Cerrar" va a 90° y la prioridad 1 nunca está a 90° (salvo con una sola opción, que es "Atrás"). Pueden coexistir. |
| **Pantallas SIN "Atrás"** (el Mapa: Favoritos está a 90°) | ⚠️ **Sí: hay que decidir** | Ver la sub-pregunta A. |
| **MAX_OPCIONES = 5** | ⚠️ Solo si se agrega "Cerrar" como opción nueva | Con el reemplazo de la sub-pregunta A (opción 1), el total no cambia y nunca pasa de 5. |
| **RF-10** (cambiar de sección cancela) | No | Una capa no es una sección: el ícono del centro sigue siendo el de la sección (D-09). Al cambiar de sección, la app quita su capa (se desmonta). |
| **RF-11 / velo** | No | Son cosas distintas: el velo es del ancla; la capa es de la app. |
| **HU-09 / RNF-01** (solo deslizar) | Lo **mejora** | Hoy cerrar una hoja exige tocar la X. Con HM-03 se cierra deslizando hacia arriba. |

### 2. Sub-preguntas

**A. Pantalla sin "Atrás" con una capa abierta (ej.: Mapa con la lista de Favoritos abierta). ¿Dónde va "Cerrar"?**
1. **(propuesta)** "Cerrar" **reemplaza temporalmente** a la opción que está a 90° (en el Mapa, Favoritos) y **nada más se mueve**, igual que C-21. Mientras la capa esté abierta esa opción queda oculta. En el ejemplo tiene sentido: la lista de Favoritos ya está abierta.
2. Se agrega "Cerrar" como opción extra y el abanico se reparte de nuevo. Todo se mueve (rompe la memoria muscular) y con 5 opciones pasaría de 6.

**B. Botón atrás del sistema** (Android; el deslizamiento desde el borde en iOS; la flecha del navegador en PC).
- **(propuesta)** Al abrirse la **primera** capa, el adaptador agrega una entrada al historial con `history.pushState` (Next 16 lo soporta: `node_modules/next/dist/docs/01-app/02-guides/single-page-applications.md`). Con "atrás", el navegador dispara `popstate` y el ancla cierra la capa de arriba en vez de salir de la página. Si la capa se cierra por otro camino (Cerrar, la X), el adaptador hace `history.back()` para no dejar entradas sobrantes.
- ⚠️ Riesgo a verificar al implementar (lo anotaría como L-15): que el router de Next no interprete ese `popstate` como una navegación. Se prueba con E2E (`page.goBack()`) y a mano en Android.

**C. Capas una encima de otra** (p. ej. una confirmación sobre una hoja): **(propuesta)** una **pila**. "Cerrar" y el atrás del sistema cierran solo la de arriba.

**D. Teclado:** **(propuesta)** con una capa abierta y el menú cerrado, `Escape` cierra la capa. Hay que decidir si esto es del ancla o de cada hoja; propongo que sea del ancla, para que funcione igual en todas las apps.

**E. Métrica:** **(propuesta)** cerrar una capa con el ancla es un `execute` con `id: "cerrar"`; el atrás del sistema se registra aparte como `layer_close {via: "sistema"}`.

### 3. Cómo lo implementaría (resumen)

1. **Núcleo:** nuevo id reservado `"cerrar"`. `orderActions(screen, { deshacer, capa })`: con `capa: true`, "Cerrar" toma el lugar de "Atrás" o, si no hay, el de la opción a 90° (sub-pregunta A-1). Sin cambios en la máquina de estados: "Cerrar" es una opción más.
2. **Adaptador:** una pila de capas en el proveedor. Hook `useAnchorLayer(abierta, onClose, { label? })`: la hoja lo llama mientras está abierta. `history.pushState` al abrir la primera y `popstate` para el atrás del sistema. Ejecutar "cerrar" llama el `onClose` de la capa de arriba.
3. **API:**
   - nuevo `useAnchorLayer`;
   - `icons` suma `close` (la X);
   - `validateScreen` reserva el id `"cerrar"`;
   - `AnchorScreen` **no cambia**.
4. **Demo:** las hojas (buscar, ofertas, favoritos, resumen del negocio, agregar plato, editar) llaman `useAnchorLayer`.
5. **Pruebas:** en el núcleo (reemplazo a 90°, pila, total ≤ 5) y E2E (cerrar deslizando, `page.goBack()`, Escape, y convivencia con Deshacer).

### 4. Qué cambia en la spec si lo apruebas
- D-10: "la posición de 90° retrocede un paso: cierra la capa abierta o, si no hay, navega hacia atrás".
- Nuevo RF-15: capas (qué es una, "Cerrar" a 90°, atrás del sistema, pila).
- Nueva HU-14: "Cerrar lo que se abrió encima solo deslizando".
- §7: `useAnchorLayer` e `icons.close`.
- §12: HM-03 queda **decidido**.
