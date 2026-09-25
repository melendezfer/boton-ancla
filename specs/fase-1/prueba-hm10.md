# Prueba de HM-10: dónde se ve la guía al desplazar

Qué cambió, qué comparar en el Nubia y qué contarme. Para levantar la demo y la red, ver `estado.md` §4–§5. **Recarga la página** antes de empezar. Cómo se desplaza con el pulgar está en `prueba-hm09.md` §3; aquí solo cambia **lo que ves** mientras lo haces.

---

## 0. Estado

| Parte | Commit | Qué |
|---|---|---|
| Decisión | `a071dc9` | spec v0.12: HM-10 en §12, RF-18, parámetros `GUIA_CORRIMIENTO` y `GUIA_SEPARACION` |
| Núcleo | `c4d63d0` | cuánto se llena el anillo y dónde va la cápsula (funciones puras) |
| Adaptador | `b9f3251` | las dos variantes, sin redibujar React en cada cuadro |
| Corrección | `1a5dd45` | la guía se salía unos píxeles de la columna del ancla (lo encontró la prueba automática) |
| Demo | `daf32b6` | selector en Ajustes y pruebas E2E de las dos variantes |

Pruebas: **446** del núcleo, **53** de la demo y **265** E2E, todas en verde. **Sin subir** a `origin/main` (espera tu permiso).

**Lo que ya no pasa:** la cápsula al costado del ancla, que le quitaba ancho a la lista. Ahora ninguna variante se sale de la **columna del ancla** (la franja de la derecha donde ya está el ancla, 88 px). Las pruebas automáticas lo miden.

---

## 1. Las dos variantes

| | **B · En el ancla** (por defecto) | **A · Arriba** |
|---|---|---|
| Dónde | El propio ancla. No aparece nada más. | Una cápsula translúcida arriba del ancla, un poco corrida hacia el centro. |
| Qué muestra | El ícono cambia a una **flecha ↓ o ↑** según hacia dónde va la lista. Un **anillo en el borde del ancla** se llena según la velocidad: vacío = quieto, lleno = a toda velocidad. En el punto de inicio se ven las dos flechas, pequeñas y tenues. | La misma cápsula de antes (flechas, raya del medio y el punto que sigue al pulgar), ahora **arriba**. |
| El pulgar | Cuando bajas el pulgar para avanzar, el ancla queda **encima** del dedo y se ve. Cuando lo subes para volver, el pulgar **pasa por encima del ancla** y la tapa un momento. | La cápsula queda **por encima de lo más alto que llega el pulgar**, así que no la tapas ni al subir. |

**Cómo cambiar:** Ajustes → "Desplazar con el ancla" marcado → **"Guía al desplazar"**: **En el ancla** o **Arriba**. El selector solo aparece con el desplazamiento activado.

---

## 2. Qué hacer con el pulgar

Haz esto **dos veces**, una con cada variante, en el mismo orden.

### 2.1 La carta (la página entera)
1. Ve a **Negocio → Ver carta**.
2. Pon el pulgar en el ancla y **bájalo un dedo** para entrar al modo desplazamiento. Luego baja un poco más y quédate quieto.
   - **B:** el ícono pasa a **↓** y el anillo se llena más cuanto más lejos está el pulgar.
   - **A:** aparece la cápsula **arriba** del ancla. El punto baja con tu pulgar.
3. Vuelve el pulgar al punto donde empezaste.
   - **B:** el anillo se vacía y ves las dos flechitas tenues.
   - **A:** el punto vuelve a la raya del medio.
4. Sube el pulgar por encima del inicio.
   - **B:** la flecha pasa a **↑**. Fíjate si tu pulgar tapa el ancla y si eso molesta.
   - **A:** el punto sube. Fíjate si tu pulgar llega a tapar la cápsula (no debería).
5. Suelta. La lista se detiene en seco y el ancla vuelve a su ícono normal.

### 2.2 Ofertas cerca y Favoritos (listas dentro de una hoja)
1. En el **Mapa**, abre el ancla y **desliza a "Ofertas cerca"**.
2. Repite los pasos 2 a 5 de arriba mientras lees los títulos de las ofertas.
   - **Lo importante aquí:** ¿alguna variante **tapa el texto de la lista**? Los títulos largos ("Café grande al precio del pequeño") llegan hasta cerca del ancla.
3. Cierra, abre **Favoritos** y repite.

### 2.3 Con la mano izquierda (opcional)
- Ajustes → **Mano: Izquierda**. Repite §2.1. En la variante A, la cápsula debe correrse a la **derecha**, hacia el centro de la pantalla.

---

## 3. Qué NO esperar
- **Cambiar la velocidad o la zona muerta:** siguen igual que en HM-09. Si quieres otro ritmo, dímelo con §4.
- **Que en la variante B nada quede bajo el dedo todo el tiempo:** al empezar, el pulgar está sobre el ancla, y al subir pasa por encima. Es lo que hay que comparar con la A.

---

## 4. Qué contarme
1. **¿Cuál prefieres, A o B?** ¿Por qué?
2. En **B:** ¿se entiende la flecha? ¿El anillo te ayuda a saber qué tan rápido va? ¿Molesta taparlo al subir?
3. En **A:** ¿la cápsula arriba se ve sin buscarla? ¿Queda muy lejos del pulgar?
4. ¿Alguna tapó texto de la lista (sobre todo en Ofertas)?
5. Con tu respuesta dejo **una sola variante** (y borro la otra) o las dos como opción de la app.
