# Prueba de HM-09: desplazar con el ancla (experimental)

Qué cambió, qué hacer con el pulgar en el Nubia y qué deberías sentir. Para levantar la demo y la red, ver `estado.md` §4–§5. **Recarga la página** antes de empezar.

---

## 0. Estado

| Parte | Commit | Qué |
|---|---|---|
| Decisión | `0748a2b` | spec v0.11: RF-18 (desplazar tipo joystick, experimental) |
| Núcleo | `55bae0f` | estado `desplazando` y la curva de velocidad |
| Adaptador | `742618d` | el desplazamiento cuadro a cuadro, la guía y la vibración en los bordes |
| Demo | `13ee87e` | interruptor en Ajustes; carta, perfil, Ofertas y Favoritos se pueden desplazar; listas más largas |

Pruebas: **437** del núcleo, **53** de la demo y **257** E2E, todas en verde. **Sin subir** a `origin/main` (espera tu permiso).

**Límite:** las E2E prueban que la página se mueve y se detiene. **Si se siente cómodo** (la velocidad, la zona muerta, la guía) solo lo dice tu pulgar.

---

## 1. La idea en una línea

Presionas el ancla y **bajas el pulgar un poco**: el ancla se vuelve un **joystick**. Cuanto más lejos del punto de inicio pongas el pulgar, más rápido se mueve la lista. Si vuelves al punto de inicio, se frena. Si **sueltas, se detiene en seco**.

- **Pulgar debajo del punto de inicio:** la lista baja (ves lo que sigue).
- **Pulgar encima del punto de inicio:** la lista sube (vuelves al principio).
- Solo hace falta **empezar** hacia abajo. Una vez dentro, puedes subir el pulgar para ir hacia atrás.

Lo que vas a ver: al lado del ancla, hacia el centro de la pantalla, aparece una **cápsula translúcida** con una flecha ↑ arriba, una ↓ abajo, una **raya en el medio** (velocidad cero) y un **punto que sigue a tu pulgar**.

---

## 2. Antes de empezar
- [ ] **Ajustes → "Desplazar con el ancla (experimental)"** debe estar **marcado**. Viene marcado por defecto.

---

## 3. Paso a paso con el pulgar

### 3.1 La carta de un negocio (la más fácil para empezar)
1. Ve a **Negocio → Ver carta** (ahora tiene 14 platos, más largo que la pantalla).
2. **Pon el pulgar sobre el ancla** y, sin levantarlo, **bájalo un dedo de distancia** (unos 2 cm).
   - **Deberías sentir:** el abanico **no** se abre. Aparece la cápsula y la carta **empieza a bajar despacio**.
3. **Baja un poco más el pulgar** y quédate quieto.
   - **Deberías sentir:** va **más rápido** cuanto más lejos estés. Al fondo de la cápsula va a toda velocidad.
4. **Vuelve el pulgar al punto donde empezaste** (sobre la raya del medio).
   - **Deberías sentir:** la carta **se frena** y se queda quieta, aunque el dedo siga apoyado.
5. **Sube el pulgar por encima de la raya.**
   - **Deberías sentir:** la carta **sube** hacia el principio.
6. Llega al final (o al principio) y sigue empujando.
   - **Deberías sentir:** una **vibración corta** al tocar el borde. La lista ya no se mueve.
7. **Suelta el pulgar** en cualquier momento.
   - **Deberías sentir:** se detiene **en seco**, sin seguir resbalando. La cápsula desaparece y **no se ejecuta ninguna opción**.

### 3.2 Ofertas cerca (una lista dentro de una hoja)
1. Ve al **Mapa**, abre el ancla y **desliza a "Ofertas cerca"**. Se abre la hoja con 12 ofertas.
2. Con la hoja abierta, **pon el pulgar en el ancla y bájalo** igual que en la carta.
   - **Deberías sentir:** se mueve **la lista de ofertas**, no el mapa de atrás. La hoja sigue abierta.
3. Juega con la velocidad (lejos = rápido, al medio = quieto, arriba = hacia atrás) y suelta.
4. Ahora **abre el ancla normal** (presiona y **desliza hacia arriba o de lado**, no hacia abajo).
   - **Deberías sentir:** sale el abanico de la hoja (**Cerrar**, **Ordenar por distancia**, **Filtrar por categoría**), como siempre. **Hacia arriba es el abanico; hacia abajo es desplazar.**

### 3.3 Favoritos (otra hoja)
1. En el **Mapa**, abre el ancla y **desliza a "Favoritos"**. Ahora hay 15 negocios guardados.
2. Baja el pulgar desde el ancla y recorre la lista hasta el final. Vuelve con el pulgar arriba.
   - **Deberías sentir:** lo mismo que en Ofertas. Solo se mueve la lista de Favoritos.
3. Prueba **"Ordenar"** desde el abanico y vuelve a desplazar: la lista invertida también se mueve.

### 3.4 Con el pulgar en descanso (mientras lees)
1. En la carta, **deja el pulgar apoyado sobre el ancla** sin moverlo, como cuando lees (modo descanso).
2. Cuando quieras avanzar, **deslízalo hacia abajo** sin levantarlo.
   - **Deberías sentir:** empieza a desplazar sin tener que soltar y volver a presionar.

### 3.5 Donde NO debe pasar
- [ ] **En el Mapa**, presiona el ancla y baja el pulgar: **no** aparece la cápsula. El mapa se mueve con el dedo, como siempre, no con el ancla.
- [ ] En **Ajustes**, **desmarca** el interruptor y vuelve a la carta: bajar el pulgar **no** desplaza. Vuelve a marcarlo al terminar.
- [ ] Un **toque corto** al ancla sigue abriendo el abanico (no desplaza).

---

## 4. Qué contarme
1. **Velocidad:** ¿la más lenta es suficiente para leer? ¿La más rápida es demasiado?
2. **Zona muerta:** ¿se queda quieto con facilidad al volver al centro, o tiembla?
3. **Entrada:** ¿se abrió el abanico sin querer al intentar desplazar, o se desplazó cuando querías el abanico?
4. **La cápsula:** ¿la ves? ¿Ayuda o estorba?
5. ¿Lo preferirías **al desplazar con el dedo en la lista**? ¿En cuál de las tres pantallas se sintió mejor?
6. Si quieres, en **Métricas** verás `scroll_start` y `scroll_end` con cuánto duró cada desplazamiento.
