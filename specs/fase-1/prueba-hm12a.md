# Prueba de HM-12a: Zoom y "apuntar y elegir" en el mapa (experimental)

Qué cambió, qué hacer con el pulgar en el Nubia y qué deberías sentir. Para levantar la demo y la red, ver `estado.md` §4–§5. **Recarga la página** antes de empezar. HM-12b (listas) viene **después** de esta prueba.

---

## 0. Estado

| Parte | Commit | Qué |
|---|---|---|
| Decisión | `579b555` | spec v0.14: RF-20 (Zoom), RF-21 (apuntar y elegir), parámetros |
| Núcleo | `293d5e9` | estados `ajustando` y `elegido`; qué hay en la mira (imán, grupos, zoom para separar) |
| Adaptador | `f140274` | mira, ancla encendida, freno, imán, zoom automático, deslizador y pista |
| Corrección | `62da547` | ajustar Zoom cuenta como uso para la bienvenida (si no, la pista del mapa no se iba nunca) |
| Demo | `58c77b9` | Zoom en el mapa, mapa con zoom, capa del negocio y del grupo, interruptor, pruebas |

Pruebas: **530** del núcleo, **53** de la demo y **311** E2E, todas en verde.

**Dos cosas para decidir** (`decisiones-pendientes.md`): la capa de un negocio tiene **4 acciones, no 5** (no caben: "Ver carta" quedó como botón en la hoja), y **Zoom cambió de lugar las opciones del mapa**.

---

## 1. Antes de empezar
- [ ] En **Ajustes** deben estar marcados: **"Mover el mapa con el ancla"** y **"Apuntar y elegir en el mapa"**. Vienen marcados.
- [ ] **Las opciones del mapa cambiaron de lugar:** Buscar sigue en la diagonal; **Zoom está arriba**; Ofertas, entre Zoom y Buscar; Mi ubicación, debajo de Buscar; Favoritos, al costado.

---

## 2. Zoom (quedarse sobre la opción)

1. En el **Mapa**, desliza del ancla hacia **arriba**, hasta **Zoom**, y **suelta enseguida**.
   - **Deberías ver:** nada cambia, y la banda dice *"Mantén sobre Zoom para acercar o alejar"*.
2. Ahora desliza hasta **Zoom** y **quédate ahí un momento** (un tercio de segundo).
   - **Deberías sentir:** el abanico se va y el ancla muestra la flecha y el anillo (como al desplazar).
3. **Sin soltar, sube el pulgar**: el mapa **se acerca**; más arriba, más rápido. **Bájalo**: se **aleja**.
4. **Suelta**: el mapa se queda con ese zoom.
   - **Fíjate:** los pines conservan su tamaño; solo cambia la distancia entre ellos.

---

## 3. Apuntar y elegir

### 3.1 La mira y el ancla encendida
1. En el Mapa (recién cargado, centrado en **Arepas Doña Rosa**), **baja el pulgar desde el ancla** para entrar al joystick.
   - **Deberías ver:** una **mira** tenue en el centro de la pantalla. Como Arepas Doña Rosa está justo ahí, la mira **se enciende** (color terracota) y abajo dice **"Arepas Doña Rosa"**. **El ancla se enciende** (fondo terracota) con el ícono de pin.
2. Mueve el pulgar para viajar por el mapa. Cuando un pin pasa **cerca de la mira**:
   - **Deberías sentir:** el mapa **frena** un poco y vibra una vez (Android); la mira se enciende con su nombre.
3. **Frena** (vuelve el pulgar al punto de inicio) con un pin cerca de la mira.
   - **Deberías ver:** el pin **se desliza solo hasta el centro de la mira** (el imán).

### 3.2 Elegir
1. Con un pin en la mira y el pulgar **quieto**, **suelta**.
   - **Deberías ver:** se abre la hoja de ese negocio. Abre el ancla: **Cerrar (arriba), Ver perfil (diagonal), Cómo llegar, Favorito y WhatsApp**. "Ver carta" es un botón en la hoja.
2. Desliza a **Cerrar**: se cierra y vuelves al mapa.
3. Ahora suelta **mientras el mapa se mueve** (pulgar lejos del inicio), aunque haya un pin en la mira.
   - **Deberías ver:** el mapa solo se detiene. **No se abre nada.** Para elegir hay que frenar primero.

### 3.3 Pines muy juntos (grupos)
En la demo hay dos pines casi encima: **Tienda La Esquinita** y **Droguería La Esquinita** (a la derecha del centro, un poco abajo; unos 500 px de mapa desde Arepas Doña Rosa).
1. Viaja con el joystick hasta ellos.
   - **Deberías ver:** la mira apunta a **los dos juntos**: el ancla muestra un **"2"** y la mira dice **"2 negocios"**.
2. **Frena y suelta enseguida** (antes de medio segundo).
   - **Deberías ver:** se abre **"2 negocios aquí"** con la lista. Toca uno (con el dedo, por ahora; apuntar en listas es HM-12b).
3. Repite, pero esta vez **frena y espera** con el pulgar quieto.
   - **Deberías ver:** a los ~0,5 s el mapa **se acerca solo** hasta separarlos, y la mira apunta a **uno** de ellos. Suelta para elegirlo.
4. **Helados Don José** y **Frutas Don José** están cerca pero separables (abajo del centro): apunta a uno sin que se imante el otro.

### 3.4 Lo de siempre sigue igual
- [ ] **Tocar un pin con el dedo** abre su hoja como siempre.
- [ ] **Arrastrar el mapa con el dedo** sigue igual.
- [ ] **Deslizamientos rápidos** a las opciones del mapa se ejecutan (y a Zoom solo dan la pista).
- [ ] Ajustes → desmarca **"Apuntar y elegir"**: el joystick mueve el mapa como en HM-11, sin mira.

---

## 4. Qué contarme
1. **Zoom:** ¿el tiempo de espera (1/3 s) es cómodo? ¿La pista se entiende? ¿La velocidad del zoom sirve?
2. **La mira:** ¿se ve bien sin estorbar? ¿El ancla encendida ayuda a saber que algo está apuntado?
3. **Freno e imán:** ¿ayudan o se sienten como si el mapa "se pegara"?
4. **Elegir frenado:** ¿se entiende que hay que frenar para elegir? ¿Elegiste algo sin querer?
5. **Grupos:** ¿"2 negocios" y la lista se entienden? ¿El zoom automático llega en buen momento?
6. Las **dos decisiones** de `decisiones-pendientes.md` (acciones de la capa y posiciones del mapa).
7. Con esto sigo con **HM-12b** (apuntar en listas).
