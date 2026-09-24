# Prueba manual de T-12 — demo en el puerto 3002

Guía para levantar la demo y abrirla en el PC y en el celular. Es la primera tarea con algo visible: una **página de diagnóstico**. Todavía no tiene las pantallas de RUTEANDO ni un ancla que responda.

---

## 0. Lo que vi al escribir esta guía (24-09-2026)

Revisé el estado sin cambiar nada:

| Qué | Estado | Qué significa |
|---|---|---|
| ¿Hay algo escuchando en el puerto 3002? | **No** | La demo no está corriendo. Por eso tampoco carga en el PC. Hay que levantarla (paso 1). |
| Reenvío del 3002 en Windows (`portproxy`) | **No existe** | Solo están los de RUTEANDO (3000, 3001 y 9000). Sin esto el celular no llega (paso 3). |
| IP interna de WSL | `172.28.23.49` | Es la IP a la que apunta el reenvío. |
| IP de Windows en el Wi-Fi | `192.168.1.7` | Es la IP que se escribe en el celular. |

Orden recomendado: **1 → 4.1 (PC) → 3 → 4.2 (celular)**. Primero confirmamos que funciona en el PC y después nos ocupamos de la red.

---

## 1. Levantar la demo

### En qué terminal
En una terminal de **WSL (Ubuntu)**, no en PowerShell ni en CMD. Es la misma donde trabajas con `git` en este proyecto.

### Comandos
```bash
cd ~/boton-ancla
npm run dev
```
- `cd ~/boton-ancla`: entra a la carpeta del proyecto. `npm run dev` solo funciona desde aquí, porque lee el `package.json` de la raíz.
- `npm run dev`: ejecuta `next dev -H 0.0.0.0 -p 3002` dentro de `apps/demo`.
  - `-p 3002`: usa el puerto 3002 (el 3001 es de RUTEANDO).
  - `-H 0.0.0.0`: escucha en todas las conexiones de red de WSL, no solo en `localhost`. Hace falta para que el reenvío de Windows pueda llegar.

**Esta terminal se queda ocupada** mientras la demo corre. No la cierres. Para lo demás, abre otra terminal de WSL.

### Qué debe aparecer cuando está lista
```
> demo@0.1.0 dev
> next dev -H 0.0.0.0 -p 3002

▲ Next.js 16.3.4 (Turbopack)
- Local:         http://localhost:3002
- Network:       http://0.0.0.0:3002
✓ Ready in 300ms
```
La línea importante es **`✓ Ready in …`**. Mientras no aparezca, la página no carga.

La primera vez que abras la página aparecerá además algo como `○ Compiling / ...` y luego `GET / 200 in …ms`. Eso es normal: Next compila la página cuando se pide por primera vez.

### Si en lugar de eso aparece un error
| Mensaje | Causa probable | Qué hacer |
|---|---|---|
| `npm error Missing script: "dev"` | No estás en `~/boton-ancla` | Ejecuta `cd ~/boton-ancla` y vuelve a intentar. |
| `Error: listen EADDRINUSE: address already in use 0.0.0.0:3002` | Ya hay otra demo corriendo en otra terminal | Busca esa terminal y ciérrala con Ctrl + C, o dime y lo revisamos. |
| `Cannot find module ...` | Faltan dependencias | Ejecuta `npm install` en `~/boton-ancla` y repite. |

---

## 2. El hallazgo de Next 16: "Cargando…" para siempre desde el celular

### El síntoma (lo que pasaba en RUTEANDO)
Desde el celular, con `next dev`, la página aparecía pero **se quedaba congelada**, por ejemplo en "Cargando sesión…". En la consola del navegador salía:
```
WebSocket connection to 'ws://192.168.1.7:3001/_next/hmr?id=...' failed:
Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE
```
En RUTEANDO se concluyó que era un problema de la red (WSL + portproxy) y se esquivó probando desde el celular con `next build && next start`.

### La causa real
No es la red: **es una protección de seguridad de Next 16 en modo desarrollo.**

1. En desarrollo, Next sirve archivos internos bajo `/_next/...`. Entre ellos está `/_next/hmr`, un **WebSocket** (una conexión que queda abierta) que usa para recargar la página en vivo cuando guardas un archivo.
2. Para que otro sitio web no pueda leer tu código en desarrollo, Next **bloquea esos recursos internos** cuando el pedido viene de un origen que no es `localhost`.
3. Desde el PC abres `http://localhost:...`, así que todo pasa. Desde el celular abres `http://192.168.1.7:...`, y para Next ese origen es "otro sitio": lo bloquea.
4. En un WebSocket, el bloqueo no devuelve un error HTTP normal: Next escribe solo la palabra `Unauthorized`, sin encabezados. El navegador no entiende esa respuesta y la reporta como `ERR_INVALID_HTTP_RESPONSE`.
5. En esta configuración, cuando esa conexión falla, React nunca termina de "hidratar" la página (conectar el HTML con su JavaScript). Por eso nada responde y se queda en "Cargando…".
6. Con `next build && next start` (modo producción) no pasaba porque en producción ese WebSocket no existe.

### Cómo lo comprobé (con `curl`, contra la demo)
Pedí el WebSocket `/_next/hmr` simulando distintos orígenes:

| Origen del pedido | Respuesta |
|---|---|
| Sin origen (como `localhost`) | `HTTP/1.1 101 Switching Protocols`: conexión abierta ✅ |
| `http://192.168.1.7:3002` (como el celular), **con** la configuración nueva | `HTTP/1.1 101 Switching Protocols` ✅ |
| `http://evil.example` (un sitio ajeno) | `Unauthorized`, sin encabezados ❌ (bloqueado, como debe ser) |
| `http://172.28.23.49:3002` (no permitido) | `Unauthorized` ❌ |

El registro de Next además lo dice explícitamente:
```
⚠ Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr from "172.28.23.49".
```

### La solución en la demo
En `apps/demo/next.config.ts`:
```ts
allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
```
Le dice a Next: "confía también en los pedidos que vengan de IPs de redes domésticas". Solo afecta a `next dev`; en producción no cambia nada. Cualquier otro origen sigue bloqueado.

En RUTEANDO no se cambió nada. Probablemente se arregla con esa misma línea en su `next.config.ts`, pero eso lo decides tú.

---

## 3. Windows: reenviar el puerto 3002 al celular (lo ejecutas tú)

### Por qué hace falta
WSL corre en **modo NAT**: Linux tiene su propia IP interna (`172.28.23.49`) que **solo ve Windows**. El celular solo ve la IP de Windows en el Wi-Fi (`192.168.1.7`). Entonces:
- Windows tiene que **reenviar** lo que llegue a su puerto 3002 hacia `172.28.23.49:3002` (`portproxy`).
- El **firewall** de Windows tiene que dejar entrar esa conexión.

Esto necesita permisos de administrador, por eso lo ejecutas tú.

### Paso 3.1 — Revisar el estado (terminal de WSL, sin permisos especiales)
```bash
cd ~/boton-ancla
npm run lan
```
Solo **lee** la configuración de Windows y dice qué falta. Si falta algo, genera el archivo `C:\Users\USUARIO\boton-ancla-lan-3002.ps1` con los comandos del paso 3.2 y la IP actual de WSL.

### Paso 3.2 — Abrir PowerShell como administrador
Tecla Windows → escribe **PowerShell** → clic derecho en "Windows PowerShell" → **Ejecutar como administrador** → acepta el aviso de Windows.

### Paso 3.3 — Ejecutar los comandos
**Opción A**, ejecutar el archivo generado (una sola línea):
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\USUARIO\boton-ancla-lan-3002.ps1"
```
`-ExecutionPolicy Bypass` permite ejecutar ese archivo esta única vez, sin cambiar la configuración de seguridad del PC.

**Opción B**, pegar las líneas una por una:

```powershell
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=3002 2>$null | Out-Null
```
Borra un reenvío anterior del 3002, si existe (por ejemplo, uno que apunta a una IP vieja de WSL). Si no existe no pasa nada: `2>$null | Out-Null` oculta el mensaje de "no encontrado".

```powershell
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=3002 connectaddress=172.28.23.49 connectport=3002
```
Crea el reenvío. `listenaddress=0.0.0.0 listenport=3002`: Windows escucha el puerto 3002 en todas sus conexiones, incluida la del Wi-Fi. `connectaddress=172.28.23.49 connectport=3002`: todo lo que llega se pasa a la demo que corre en WSL.

```powershell
Remove-NetFirewallRule -DisplayName 'Boton-ancla dev (LAN)' -ErrorAction SilentlyContinue
```
Borra la regla de firewall de este proyecto, si ya existía, para no duplicarla. `-ErrorAction SilentlyContinue` evita un error si no existe.

```powershell
New-NetFirewallRule -DisplayName 'Boton-ancla dev (LAN)' -Direction Inbound -Protocol TCP -LocalPort 3002 -RemoteAddress LocalSubnet -Action Allow | Out-Null
```
Crea la regla que **permite conexiones entrantes** (`Inbound`) al puerto TCP 3002, **solo desde tu red local** (`-RemoteAddress LocalSubnet`). En un Wi-Fi público nadie de afuera podría abrir la demo. Las reglas de RUTEANDO no se tocan.

```powershell
netsh interface portproxy show v4tov4
```
No cambia nada: **muestra** los reenvíos activos. Debe aparecer:
```
0.0.0.0         3002        172.28.23.49    3002
```
junto a los de RUTEANDO (3000, 3001 y 9000).

### Paso 3.4 — Confirmar (de vuelta en la terminal de WSL)
```bash
npm run lan
```
Debe decir **"Listo, no hay que hacer nada en Windows"** y mostrar la URL del celular.

### Cuándo repetir el paso 3
La IP interna de WSL **cambia** al reiniciar Windows o al hacer `wsl --shutdown`. Si un día el celular deja de conectar, corre `npm run lan`: te dirá si el reenvío apunta a una IP vieja y generará el `.ps1` nuevo.

---

## 4. Verificar que todo funciona

### 4.1 En el PC: ¿el servidor está vivo?
Con la demo corriendo en la terminal 1, abre **otra terminal de WSL** y ejecuta:

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3002/
```
Pide la página sin mostrarla y escribe solo el código de respuesta.
- `HTTP 200` → el servidor está vivo ✅
- `HTTP 000` → no hay nada en el 3002: la demo no está corriendo, o está en otra terminal que se cerró.

```bash
ss -ltnp | grep 3002
```
Muestra si algún programa escucha en el 3002. Debe aparecer una línea con `0.0.0.0:3002`; el programa puede figurar como `next-server` o `node`. Si no sale nada, la demo no está corriendo.

Después, en el **navegador del PC**, abre:
```
http://localhost:3002
```
Debe aparecer "Botón-ancla · demo" y, en uno o dos segundos, un recuadro **verde: "React cargó en este dispositivo"**.

### 4.2 En el celular: ¿la red llega?
**Antes de tocar el celular**, comprueba desde el PC la ruta completa que usará el celular (Wi-Fi → Windows → reenvío → WSL). Hazlo desde **PowerShell normal** (no hace falta administrador):
```powershell
Test-NetConnection 192.168.1.7 -Port 3002
```
Intenta conectarse al puerto 3002 usando la IP del Wi-Fi.
- `TcpTestSucceeded : True` → el reenvío funciona ✅
- `False` → falta el paso 3, o la demo no está corriendo.

```powershell
curl.exe -s -o NUL -w "HTTP %{http_code}`n" http://192.168.1.7:3002/
```
Pide la página por la IP del Wi-Fi, como lo haría el celular. Debe decir `HTTP 200`.

Ahora en el **celular**:
1. Conéctalo al **mismo Wi-Fi** que el PC (no a los datos móviles).
2. Abre el navegador y escribe exactamente:
   ```
   http://192.168.1.7:3002
   ```
   Con `http://` (no `https://`) y con `:3002` al final.
3. Debe aparecer la misma página, con el recuadro **verde**.

| Qué ves en el celular | Qué significa |
|---|---|
| La página con el recuadro verde | Todo funciona ✅ |
| La página con el recuadro **amarillo** que nunca cambia | La red llega, pero el JavaScript no terminó de cargar. Es justo el problema de la sección 2. Avísame. |
| "No se puede acceder al sitio" o la página no termina de cargar | La red no llega: revisa el paso 3 y que el celular esté en el mismo Wi-Fi. |
| El navegador cambia sola la dirección a `https://` | Escríbela de nuevo con `http://`. |

### 4.3 Qué revisar en la página (lo único que existe en T-12)
- [ ] Recuadro verde en **PC y celular**.
- [ ] "Puntero táctil": **no** en el PC, **sí** en el celular.
- [ ] "Vibración": **sí** en Android, **no** en iPhone.
- [ ] "Contexto seguro": **no** en el celular (se abre por HTTP en la red local; es lo esperado).
- [ ] "Área segura abajo": **mayor que 0** en un iPhone con barra de inicio.
- [ ] El **círculo punteado "ancla"** se ve abajo a la derecha, entero, sin quedar tapado por la barra del navegador ni por la barra de inicio.
- [ ] (Opcional) Con la página abierta en el celular, cambia un texto de `apps/demo/src/app/page.tsx` en el PC y guarda: el celular debería actualizarse solo. Eso confirma que la recarga en vivo funciona.

### Todavía NO esperes
- Que el círculo responda al toque: es solo una marca. El ancla real llega en T-15.
- Las pantallas de RUTEANDO (mapa, perfil, carta, producto), los ajustes ni las métricas: llegan en T-13.
- Abanico, vibración, avisos ni etiquetas: llegan en T-15 a T-23.

---

## 5. Apagar la demo
- En la terminal donde corre `npm run dev`, presiona **Ctrl + C**.
- El reenvío y la regla del firewall pueden quedarse: sin la demo corriendo no hay nada que abrir. Si quieres quitarlos, en PowerShell **como administrador**:
  ```powershell
  netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=3002
  Remove-NetFirewallRule -DisplayName 'Boton-ancla dev (LAN)'
  ```
