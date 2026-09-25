# Prueba de HM-08 (acciones de cada capa) y HM-06 (el ancla sobre el teclado)

Qué cambió, qué probar en el Nubia y qué no esperar. Para levantar la demo y la red, ver `estado.md` §4–§5. **Recarga la página** antes de empezar.

---

## 0. Estado

| Parte | Commit | Qué |
|---|---|---|
| Decisiones (todas A) | `b47ab61` | spec v0.10: RF-13, RF-15, RF-17 |
| Núcleo | `b576907` | `pantallaDeCapa`, "Ocultar teclado" fijo a 180° |
| Adaptador | `cbccecf` | acciones, ícono y nombre de la capa; el ancla sube sobre el teclado |
| Demo | `5ebd29f` | acciones de Buscar, Ofertas cerca y Favoritos |

Pruebas: **406** del núcleo, **53** de la demo y **245** E2E, todas en verde. Todo subido a `origin/main`.

**Límite:** el teclado en las E2E es **simulado**. Lo del teclado real (§1.2) solo lo confirma tu Nubia.

---

## 1. Qué probar en el Nubia

### 1.1 Cada capa tiene su propio abanico
- [ ] **Mapa → Ofertas cerca.** Con la lista abierta, el **centro del ancla muestra la etiqueta de oferta** (no el mapa) y el abanico tiene: **Cerrar (arriba)**, **Ordenar por distancia** (diagonal) y **Filtrar por categoría** (costado). Las opciones del mapa no están.
  - [ ] "Ordenar por distancia": la lista queda de la más cercana a la más lejana.
  - [ ] "Filtrar por categoría" varias veces: Comida → Bebidas → Todas (lo dice la línea de arriba de la lista).
- [ ] **Mapa → Favoritos.** Abanico: Cerrar, **Ordenar** (invierte A–Z / Z–A) y **Ver en el mapa** (cierra la lista y centra el mapa).
- [ ] Cierra cualquiera de las dos: vuelven las opciones del mapa **en sus mismas posiciones**.
- [ ] Toca un pin (resumen del negocio): su abanico solo tiene **Cerrar**, y el centro dice el nombre del negocio.

### 1.2 Buscar y el teclado (HM-06)
- [ ] **Mapa → Buscar.** Sale el teclado y **el ancla NO desaparece**: sube y queda **sobre el teclado**.
- [ ] Abre el ancla con el teclado abierto: **Cerrar (arriba) · Borrar texto (diagonal) · Ocultar teclado (costado)**.
  - [ ] Escribe algo y desliza a **Borrar texto**: se vacía y puedes seguir escribiendo.
  - [ ] Desliza a **Ocultar teclado**: el teclado baja **sin tocar nada** (D-15).
- [ ] Con el teclado bajado, abre el ancla: **Cerrar · Escribir · Borrar texto**. "Escribir" vuelve a abrir el teclado.
- [ ] ¿El abanico cabe bien sobre el teclado? ¿Llegas a las tres opciones?

### 1.3 Deshacer dentro de una capa (1-A)
- [ ] Rol Dueño → un producto → **Marcar no disponible** (aparece "Deshacer" 5 s).
- [ ] Enseguida toca el botón **"Editar producto"** del contenido (abre una hoja).
- [ ] Abre el ancla: **Cerrar y Deshacer**. Desliza a Deshacer: el producto vuelve a "Disponible".

### 1.4 Repaso rápido
- [ ] El botón atrás del celular sigue cerrando la hoja sin salir de la página (HM-03).
- [ ] La X de las hojas sigue libre del ancla (HM-07), también con el ancla sobre el teclado.

---

## 2. Qué NO esperar todavía
- **Desplazar con el ancla (HM-09):** está registrado y analizado, pero **no implementado**; espera tu visto bueno (`decisiones-pendientes.md`).
- **Resultados de búsqueda:** Buscar sigue siendo solo visual (`prueba-hm03-hm07.md` §2).

---

## 3. Qué contarme
1. Si §1.2 (teclado real) funcionó en el Nubia: sobre todo "Ocultar teclado" y si el abanico cabe sobre el teclado.
2. Qué se sintió raro al pasar de la pantalla a la capa (el centro que cambia de ícono, las opciones que cambian).
3. Tu visto bueno (o cambios) para HM-09 y las 4 preguntas de su §4.
