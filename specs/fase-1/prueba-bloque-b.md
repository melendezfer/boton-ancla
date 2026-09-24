# Prueba del Bloque B (T-12, T-13, T-14) y de HM-01

Guía para probar en el PC y en el celular todo lo que existe al cerrar el Bloque B. Complementa `prueba-t12.md`, donde están los detalles de red (portproxy).

---

## 0. Estado del bloque

| Tarea | Estado | Qué hay |
|---|---|---|
| HM-01 | ✅ | El ancla sube a 30 % del alto útil (parámetro `ANCLA_ALTURA`, con piso y techo). En Ajustes hay un control deslizante para cambiarla. Registrado en `spec.md` §12. |
| T-12 | ✅ | Demo en el puerto 3002 que carga en el PC y en el celular (confirmado por ti). |
| T-13 | ✅ | Pantallas simuladas de RUTEANDO, mapa falso arrastrable, hojas inferiores y **ancla y abanico fantasma** (dibujos punteados que todavía no responden). |
| T-14 | ⚠️ **Parcial** | Playwright está configurado y las pruebas están escritas, pero **no se pudieron ejecutar**: al sistema le faltan librerías que se instalan con `sudo` (paso 1). |

Pruebas automáticas que sí corren hoy: 362 del núcleo y 24 de la demo (Vitest), todas en verde.

**Todavía no revisé las pantallas en un navegador real**, solo su HTML con `curl`. Tu prueba manual es la primera mirada. Si algo se ve roto, cuéntame qué y dónde.

---

## 1. Paso previo: instalar las librerías de Playwright (lo haces tú, una sola vez)

### Por qué
Playwright descarga sus propios navegadores (Chromium y WebKit), pero para arrancar necesitan librerías de Ubuntu que no están instaladas (por ejemplo `libnspr4.so` para Chromium, y GTK/GStreamer para WebKit). Instalarlas necesita permisos de administrador (`sudo`), y yo no los tengo.

### Comando
En una terminal de **WSL**:
```bash
cd ~/boton-ancla/apps/demo
sudo npx playwright install-deps chromium webkit
```
- `sudo`: ejecuta como administrador; te va a pedir **tu contraseña de Ubuntu** (al escribirla no se ve nada; es normal).
- `npx playwright install-deps chromium webkit`: le pide a `apt` (el instalador de Ubuntu) las librerías exactas que necesitan esos dos navegadores. No toca el proyecto; solo instala paquetes del sistema.

Tarda unos minutos. Al final no debería mostrar errores en rojo.

### Después: correr las pruebas E2E
```bash
cd ~/boton-ancla
npm run e2e
```
Si la demo ya está corriendo en otra terminal, Playwright la **reutiliza**; si no, la levanta sola.

**Qué debería pasar:** 25 pruebas pasan y 1 se salta.
- 13 en `pixel-7` (Chromium).
- 12 en `iphone-14` (WebKit), más 1 saltada a propósito: la del control deslizante, porque un deslizador nativo no reacciona a los eventos sintéticos de WebKit (L-07).

Si algo falla, el detalle queda en `apps/demo/playwright-report/`. Para verlo: `npx playwright show-report apps/demo/playwright-report`. Pásame el nombre de la prueba y el error.

---

## 2. Levantar la demo

Si ya la tienes corriendo desde antes, **no hace falta reiniciarla**: `next dev` tomó los cambios solo. Solo **recarga la página** en el PC y en el celular.

Si no está corriendo, en una terminal de WSL:
```bash
cd ~/boton-ancla
npm run dev
```
Espera `✓ Ready in …`.

Para el celular, confirma que el reenvío sigue apuntando a la IP actual de WSL:
```bash
npm run lan
```
Debe decir "Listo, no hay que hacer nada en Windows". Si no, sigue `prueba-t12.md` §3.

URLs:
- PC: `http://localhost:3002` (redirige a `/mapa`).
- Celular: `http://192.168.1.7:3002`.

---

## 3. Qué probar y qué debería pasar

Hazlo primero en el PC (rápido, para ver que todo carga) y después en el celular con **una sola mano**.

### 3.1 Elementos comunes a todas las pantallas
- **Barra superior**: a la izquierda "Atrás" (salvo en el mapa), en el centro el nombre de la sección, y a la derecha tres íconos: Diagnóstico (estetoscopio), Métricas (gráfico de barras) y Ajustes (engranaje).
- **Ancla fantasma**: un círculo punteado violeta del lado derecho, **más o menos a un tercio de la altura** (HM-01), con el ícono de la sección adentro.
- **Abanico fantasma**: círculos punteados más chicos, cada uno con su ícono y etiqueta, repartidos de "arriba" hacia "la izquierda" del ancla, más un anillo punteado tenue (el anillo exterior de los irreversibles). **No responden al toque.**

### 3.2 Mapa (`/mapa`)
- [ ] El mapa ocupa toda la pantalla y **se arrastra con un dedo** en cualquier dirección, sin mover la página entera ni hacer zoom.
- [ ] El pin violeta es "Arepas Doña Rosa"; los grises son otros negocios.
- [ ] **Tocar un pin** abre una hoja abajo con el nombre del negocio. **El ancla fantasma queda por encima de la hoja** (RF-14).
- [ ] En la hoja de Arepas Doña Rosa, "Ver perfil" lleva al perfil.
- [ ] Arrastrar el mapa empezando sobre un pin **no** abre la hoja.
- [ ] Abanico fantasma: Buscar (diagonal-izquierda, 150°), Mi ubicación (120°), Ofertas cerca (izquierda, 180°) y Favoritos (arriba, 90°).

### 3.3 Perfil de negocio (`/negocio`)
- [ ] Foto arriba, nombre, "Abierto ahora", "Local" y el botón "Ver carta".
- [ ] Arriba dice "Viendo como visitante".
- [ ] La página se puede desplazar (hay texto largo a propósito, para probar el descanso cuando exista el ancla).
- [ ] Abanico fantasma (visitante): **Atrás arriba**, Carta en la diagonal, Cómo llegar, Favorito y Compartir.

### 3.4 Carta (`/negocio/carta`)
- [ ] Lista de 4 productos. "Empanada de pipián" tiene la insignia **"No disponible"**.
- [ ] Como visitante, los productos no se abren y aparece la nota de cambiar el rol a Dueño.
- [ ] Abanico fantasma: Atrás, Compartir y Favorito.

### 3.5 Ajustes (`/ajustes`) — aquí está HM-01
- [ ] **Control "Altura del ancla"**: desliza el círculo del control con el pulgar. El ancla fantasma (y su abanico) **sube y baja en vivo**. El texto muestra el porcentaje y los px sobre el borde.
- [ ] Se puede usar **solo deslizando**, sin tocar nada más.
- [ ] Al subirlo mucho, el ancla deja de subir en algún punto: es el **techo** que deja caber el abanico.
- [ ] "Volver al valor inicial (30 %)" lo devuelve.
- [ ] "Mostrar el abanico de referencia" apaga o prende los círculos del abanico (el ancla queda).
- [ ] **Mano → Izquierda**: el ancla pasa al lado izquierdo y el abanico se refleja (Atrás sigue arriba).
- [ ] **Rol → Dueño**: en el perfil cambian las acciones (Agregar plato, Editar, Atrás), y en la carta los productos ya se abren.
- [ ] **Fondo del mapa**: "Foto" y "Oscuro" cambian el fondo del mapa. Vuelve al mapa y mira si el ancla fantasma **se distingue** en cada fondo.
- [ ] Las preferencias **se mantienen al recargar** la página.

### 3.6 Detalle de producto (rol Dueño; tocar un producto en la carta)
- [ ] Foto, nombre, precio, "Disponible" o "No disponible" y descripción.
- [ ] Abanico fantasma: Atrás, Editar, Marcar no disponible y **Eliminar a la izquierda (180°)**.
- [ ] En "Empanada de pipián" (no disponible), la opción "Marcar no disponible" se ve **atenuada** (C-09).

### 3.7 Métricas y Diagnóstico
- [ ] Métricas: solo un texto que dice que llega en T-25.
- [ ] Diagnóstico: el recuadro verde "React cargó…" y la tabla de T-12.
- [ ] Abanico fantasma en las dos: **solo "Atrás", arriba** (C-22).

---

## 4. HM-01: encontrar la altura cómoda

Es lo más importante de esta prueba.

1. Toma el celular **con una sola mano** (la derecha, si Mano = Derecha), como lo harías caminando.
2. Ve a Ajustes y mueve el control hasta que el **ancla fantasma quede donde el pulgar descansa naturalmente**.
3. Ve al **Mapa** y al **Perfil** y mira si **todas** las opciones del abanico fantasma te quedarían al alcance **sin cambiar la posición de la mano**. Fíjate sobre todo en la de arriba (90°) y en la de la izquierda (180°).
4. Si alguna queda incómoda, ajusta la altura y repite.

**Anótame:**
- el porcentaje que te resultó cómodo (y los px que muestra);
- el modelo del celular;
- con qué mano probaste;
- qué opción del abanico quedó más difícil de alcanzar.

Con eso fijo el valor por defecto de `ANCLA_ALTURA` en la spec, o abrimos otro hallazgo HM-02 si hace falta otro cambio, por ejemplo el radio o el arco (P-05).

---

## 5. Qué NO esperar todavía

| No esperes | Por qué | Cuándo llega |
|---|---|---|
| Que el ancla o el abanico respondan al toque | Son solo dibujos punteados | T-15 y T-16 |
| Que se abran Buscar, Ofertas cerca, Favoritos, Mi ubicación, Compartir, etc. | Esas acciones las ejecuta el ancla | T-24 (ya están programadas, esperando al ancla) |
| Modo descanso, modo toque, confirmación de Eliminar, aviso de deshacer | Son del ancla real | T-17 a T-19 |
| Vibración | Es del ancla real (y en iPhone no existe) | T-16 |
| Etiquetas de bienvenida, demostración inicial | Bienvenida | T-23 |
| Métricas registradas o exportables | Aún no hay eventos | T-25 |
| Que el teclado oculte el ancla | RF-13 | T-20 |
| Que los favoritos o los productos eliminados sobrevivan al recargar | Son datos simulados en memoria, a propósito | — |
| Que las pruebas de "iphone-14" equivalgan a un iPhone real | Es WebKit de escritorio con tamaño de iPhone (L-07) | La prueba manual en iPhone sigue siendo obligatoria |

---

## 6. Qué contarme al terminar
1. Si `sudo npx playwright install-deps …` terminó bien y cuántas pruebas pasaron con `npm run e2e`.
2. Lo del punto 4 (altura cómoda de HM-01).
3. Cualquier cosa que se vea rota, cortada o tapada, con el nombre de la pantalla y si pasa en el PC, en el celular o en los dos.
4. En qué fondo del mapa (claro, foto u oscuro) se distinguía peor el ancla fantasma.
