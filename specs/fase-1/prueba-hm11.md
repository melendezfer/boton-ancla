# Prueba de HM-11: mover el mapa con el ancla (experimental)

Qué cambió, qué hacer con el pulgar en el Nubia y qué deberías sentir. Para levantar la demo y la red, ver `estado.md` §4–§5. **Recarga la página** antes de empezar.

---

## 0. Estado

| Parte | Commit | Qué |
|---|---|---|
| Decisión | `45d90b2` | spec v0.13: RF-19, HU-13 ajustada, HM-11 en §12; opciones de zoom en `decisiones-pendientes.md` |
| Núcleo | `3006e3d` | velocidad y flecha en 2D; pruebas de que el modo experto no entra al joystick |
| Adaptador | `d4cbc02` | `useAnchorPan`, interruptor `desplazarLibre`, flecha que gira y círculo |
| Demo | `b142474` | interruptor en Ajustes, el mapa se registra, pruebas E2E |

Pruebas: **500** del núcleo, **53** de la demo y **287** E2E, todas en verde. **Sin subir** a `origin/main` (espera tu permiso).

**Límite:** las E2E prueban la dirección, la parada y que nada choca. **Si la velocidad sirve para buscar algo en el mapa** solo lo dice tu pulgar.

---

## 1. La idea en una línea

En el mapa, presionas el ancla y **bajas el pulgar un poco** (igual que en HM-09). Desde ahí el ancla es un joystick **libre**: mueve el pulgar hacia donde quieras ir y el mapa viaja hacia allá. Cuanto más lejos del punto de inicio, más rápido. **Sueltas y se detiene en seco.**

- Pulgar a la **izquierda** del inicio: ves lo que está a la izquierda.
- Pulgar **arriba**: ves lo que está más arriba (el norte del mapa).
- En **diagonal** también funciona: la velocidad depende de la distancia, no de la dirección.

---

## 2. Antes de empezar
- [ ] **Ajustes → "Mover el mapa con el ancla (experimental)"** marcado. Viene marcado.
- [ ] **"Guía al desplazar"**: empieza con **En el ancla**. Después repite con **Arriba** (§3.3).

---

## 3. Paso a paso con el pulgar

### 3.1 Mover el mapa
1. Ve al **Mapa**. Busca con la vista un pin lejano, por ejemplo "Mazamorra Doña Ana" (abajo a la izquierda).
2. **Pon el pulgar en el ancla y bájalo un dedo** (unos 2 cm).
   - **Deberías sentir:** el abanico **no** se abre. El ícono del ancla pasa a una **flecha** y aparece el anillo.
3. **Lleva el pulgar hacia la izquierda y un poco abajo** del punto donde empezaste, y quédate quieto.
   - **Deberías sentir:** el mapa viaja hacia abajo a la izquierda. La **flecha apunta hacia allá** y el anillo se llena más cuanto más lejos está el pulgar.
4. **Mueve el pulgar en círculo** alrededor del inicio, despacio.
   - **Deberías sentir:** la flecha gira con tu pulgar y el mapa cambia de rumbo sin cortes.
5. **Vuelve al punto de inicio**: el mapa se frena y la flecha casi desaparece.
6. **Suelta**: se detiene en seco. **No se abre nada** aunque haya un pin bajo el dedo.

**Lo importante:** ¿pudiste llegar al pin sin que tu dedo tapara el camino?

### 3.2 Lo de siempre sigue igual
- [ ] **Arrastra el mapa con el dedo** (lejos del ancla): se mueve como siempre.
- [ ] **Toca un pin**: abre su resumen como siempre.
- [ ] **Deslizamientos rápidos** (modo experto): desliza rápido del ancla a **Buscar**, **Mi ubicación**, **Ofertas cerca** y **Favoritos** y suelta sin esperar. Cada uno debe ejecutarse **sin** que el mapa se mueva.
  - Prueba a propósito algunos rápidos y "torcidos". Si alguno movió el mapa en vez de ejecutar la opción, **anótalo**: es el choque que más me interesa.
- [ ] Con el **resumen de un pin** abierto, baja el pulgar desde el ancla: el mapa **no** se mueve (manda la hoja, HM-03).
- [ ] Con **Favoritos** u **Ofertas cerca** abiertas, baja el pulgar: se mueve **la lista**, no el mapa (igual que en HM-09).

### 3.3 Con la variante "Arriba"
1. Ajustes → **"Guía al desplazar": Arriba**. Vuelve al Mapa.
2. Repite §3.1.
   - **Deberías ver:** un **círculo translúcido arriba del ancla** con un punto que se mueve como tu pulgar (a la mitad de la distancia) y una flecha girada.
   - **Deberías sentir:** el pulgar nunca tapa el círculo, ni al subir.
   - En el mapa, el círculo **sí** sale un poco de la franja del ancla. Aquí no hay texto de lista que tapar, pero dime si tapa algo del mapa que querías ver.

### 3.4 Apagar el interruptor
- [ ] Ajustes → desmarca **"Mover el mapa con el ancla"**. En el Mapa, bajar el pulgar ya **no** mueve el mapa (se cancela como antes de HM-11). El desplazamiento de las listas (HM-09) sigue funcionando: son interruptores separados.

---

## 4. Qué NO esperar todavía
- **Zoom con una mano:** no está hecho. Hay 3 opciones en `decisiones-pendientes.md` §1 (A: acercar y alejar en el abanico; **B: una opción "Zoom" que convierte el ancla en un deslizador**, la recomendada; C: doble toque y deslizar). Espera tu decisión.
- **Bordes del mapa:** el mapa falso tiene un borde. Al llegar vibra una vez (solo Android) y deja de avanzar en esa dirección.

---

## 5. Qué contarme
1. ¿La **velocidad** sirve para el mapa? (Es la misma de las listas: máximo 1400 px/s.) ¿Muy lenta para cruzar la ciudad, o muy rápida para afinar?
2. ¿La **flecha girada** se entiende? ¿Prefieres "En el ancla" o "Arriba" aquí, igual que en las listas?
3. ¿Algún **deslizamiento rápido** movió el mapa por error (§3.2)?
4. ¿Lo usarías en vez de arrastrar con el dedo? ¿En qué momento?
5. Tu elección para el **zoom** (A, B o C) o una idea distinta.
