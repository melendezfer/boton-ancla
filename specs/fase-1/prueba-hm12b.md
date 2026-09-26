# Prueba de HM-12b: apuntar y elegir en listas (y los cambios de HM-13 / HM-14)

Qué cambió, qué hacer con el pulgar en el Nubia y qué deberías sentir. Para levantar la demo y la red, ver `estado.md` §4–§5. **Recarga la página** antes de empezar.

---

## 0. Estado

| Parte | Commit | Qué |
|---|---|---|
| Decisiones | `0c4ac73` | spec v0.15: HM-13 (aprendizaje), HM-14 y RF-22 (regla de 90°), RF-23 (listas) |
| Regla de 90° | `1eb1a0d` | 90° es de "volver" o de una acción inofensiva; en el mapa, **Mi ubicación** |
| Capa del negocio | `f9fa8a5` | Carta/Productos/Servicios · Cómo llegar · WhatsApp (si lo tiene) · Favorito |
| Núcleo | `a55c11f` | pasar de desplazar a apuntar (y volver) y elegir al soltar |
| Adaptador | `3853a13`, `70b7c89` | franja de foco, pasos de uno en uno; la franja va hasta el elemento en los extremos |
| Demo | `a27299a` | Favoritos, Ofertas, el grupo y la carta; hojas apiladas |

Pruebas: **550** del núcleo, **54** de la demo y **333** E2E, todas en verde. Todo subido a `origin/main`.

---

## 1. Lo que cambió de lugar (HM-14)

En el **Mapa**, el abanico ahora es: **Mi ubicación arriba (90°)**, Favoritos entre arriba y la diagonal, **Buscar en la diagonal** (como siempre), Ofertas entre la diagonal y el costado, y **Zoom al costado (180°)**.
- [ ] Desliza hacia **arriba**: Mi ubicación. Es inofensiva: si fue sin querer, solo centra el mapa.
- [ ] En cualquier hoja, arriba sigue siendo **Cerrar**; en las demás pantallas, **Atrás**.

## 2. La hoja de un negocio (HM-13)
- [ ] Toca un pin (o elígelo con la mira): el abanico tiene **Cerrar · Carta · Cómo llegar · WhatsApp · Favorito**.
- [ ] **Costuras y Arreglos María** dice **Servicios** en vez de Carta.
- [ ] **Empanadas La Esquina** no tiene WhatsApp: su abanico tiene una opción menos.
- [ ] "Ver perfil completo" es el botón de la hoja (solo en Arepas Doña Rosa).

---

## 3. Apuntar en una lista, paso a paso

### 3.1 Favoritos
1. En el Mapa, desliza a **Favoritos**.
2. **Baja el pulgar desde el ancla** (entras a desplazar, como en HM-09) y recorre un poco la lista.
3. **Sin soltar, lleva el pulgar hacia el centro de la pantalla** (hacia la izquierda con la mano derecha), unos 2 cm.
   - **Deberías ver:** la lista **se detiene** y aparece una **franja** (borde de color) a la mitad de la lista. La fila que queda dentro se **resalta** y el **ancla se enciende**.
4. **Sube o baja el pulgar** despacio.
   - **Deberías sentir:** la franja **salta de una fila en una** (con una vibración corta en Android) y la lista se acomoda para dejar la fila en la franja.
5. **Suelta** con una fila en la franja.
   - **Deberías ver:** se abre la hoja de **ese negocio encima** de Favoritos.
6. Desliza a **Cerrar** (arriba).
   - **Deberías ver:** vuelves a Favoritos **exactamente donde estabas**.

### 3.2 Volver a desplazar
- [ ] En *apuntar*, **regresa el pulgar hacia el ancla** (hacia el borde): la franja desaparece y vuelves a *desplazar*. Si sueltas ahí, **no se elige nada**.

### 3.3 Los extremos
- [ ] Con la lista al principio, apunta y **sube** varias filas: la franja **sube hasta la primera fila** (la lista ya no puede bajar más). Soltar la elige.

### 3.4 Ofertas y la carta
- [ ] **Ofertas cerca**: apunta una oferta y suelta: se abre **su negocio** encima.
- [ ] **Carta** (Negocio → Ver carta) como **visitante**: apunta un plato y suelta: se abre la hoja del plato (precio y descripción).
- [ ] Como **dueño** (Ajustes → Rol: Dueño): apuntar un plato y soltar abre su **detalle de producto**.

### 3.5 Lo de siempre
- [ ] **Tocar una fila con el dedo** hace lo mismo que elegirla (abre su hoja encima; la X vuelve a la lista).
- [ ] Ajustes → desmarca **"Apuntar y elegir"**: llevar el pulgar al costado ya no hace nada; la lista solo se desplaza.

---

## 4. Qué contarme
1. ¿Se descubre solo que **ir hacia el centro** pasa a apuntar, o hace falta explicarlo?
2. **El paso de una fila (28 px):** ¿demasiado sensible, o hay que mover mucho el pulgar?
3. ¿La **franja** se ve bien? ¿Tapa el texto de la fila?
4. **Volver a la misma posición** al cerrar: ¿se nota y ayuda?
5. ¿El nuevo lugar de **Mi ubicación arriba** se siente natural?
