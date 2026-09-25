# Prueba del Bloque D (T-24 a T-28)

Qué cambió en este bloque, qué probar en el PC y el celular, y qué falta para cerrar la Fase 1. Para levantar la demo y la red, ver `estado.md` §4–§5.

---

## 0. Estado

| Tarea | Estado | Qué quedó |
|---|---|---|
| T-24 | ✅ | E2E: cada pantalla muestra exactamente sus acciones en su ángulo; HU-10. |
| T-25 | ✅ | **Pantalla Métricas**: eventos guardados en el celular, resumen, exportar JSON. |
| T-26 | ✅ | E2E que recorre **todas** las acciones **solo deslizando**; tabla HU → prueba. |
| T-27 | ⚠️ **Parcial** | Contraste medido (Vitest), rendimiento medido y **mejorado**. **Falta**: 3 personas y un Android de gama baja. |
| T-28 | ✅ | `README.md` del repositorio. |

Pruebas: **380** del núcleo, **53** de la demo y **193** E2E, todas en verde; 7 se saltan a propósito (6 mediciones opcionales de rendimiento y el control deslizante en WebKit).

**Dos cosas que conviene que sepas:**
1. **Optimización de rendimiento** (RNF-03): el ancla se redibujaba en cada movimiento del dedo; ahora solo cuando cambia algo visible. Con la CPU frenada ×4, el p95 bajó de 33 a 17 ms. En tu celular debería sentirse igual o más fluido: **confírmalo**.
2. **Un commit con una prueba en rojo** (`f999b4d`): se hizo el commit aunque una E2E había fallado, porque mi comando no revisaba el resultado. Era una prueba que escribía antes de que la página terminara de cargar; se corrigió en `7e5859f`. Desde ahí el commit solo se hace si las pruebas pasan.

---

## 1. Qué probar

Recarga la demo en el PC y en el celular.

### 1.1 Métricas (T-25) — lo nuevo visible
- [ ] Usa el ancla un rato en varias pantallas: ejecuta, cancela volviendo al centro, suelta sobre Eliminar sin cruzar el anillo, deshaz algo, descansa el pulgar.
- [ ] Barra superior → **Métricas** (gráfico de barras): el **resumen** cuenta ejecuciones, cancelaciones, bloqueos, deshacer y descansos; "Últimos eventos" los lista con la hora.
- [ ] "Dispositivo" viene prellenado (p. ej. "Android 15 · Chrome 140"); corrígelo si hace falta. Mano y altura se muestran (se cambian en Ajustes).
- [ ] Escribe **Observaciones** y toca **Descargar JSON**. En Android el archivo va a Descargas; en iPhone se abre una vista previa, desde donde se guarda o comparte.
- [ ] Abre "Ver el JSON": se puede seleccionar y copiar a mano (L-10: por HTTP en la red local no hay portapapeles).
- [ ] Recarga: los eventos siguen ahí. "Borrar registros" (con confirmación) los borra.

### 1.2 Fluidez (optimización)
- [ ] Recorre el abanico de lado a lado varias veces rápido: ¿se siente fluido, sin saltos?

### 1.3 Repaso rápido
- [ ] Todo lo de `prueba-bloque-c.md` §2 sigue funcionando (no debería cambiar nada de comportamiento).

---

## 2. Decisiones que tomé para T-25 (a confirmar con el Documento 8)

Registradas en spec §9 y en design §0 (C-20). Si el Documento 8 dice otra cosa, se ajusta; el JSON guarda también los eventos crudos, así que no se pierde nada.
- **"errores"** de una acción = cancelaciones y bloqueos de irreversibles desde la ejecución anterior.
- **"posición"** = altura del ancla (`ANCLA_ALTURA`) y lado (derecha o izquierda).
- **"número de opciones"** = opciones del abanico en la pantalla donde ocurrió, contando "Atrás".
- Se guardan como máximo **2000** eventos en el dispositivo; los más viejos se descartan.

---

## 3. Qué falta para cerrar la Fase 1 (criterio de salida, spec §10)

1. **Sesiones con 3 personas**, una usando **solo deslizamiento**. Procedimiento y tabla en `pruebas-manuales.md` §1 y §3: cada sesión termina exportando el JSON desde Métricas.
2. **Rendimiento en un Android de gama baja real** (L-08): `pruebas-manuales.md` §5.
3. Con eso, T-27 pasa a `[x]` y la Fase 1 queda cerrada.

**No esperes** nada nuevo del ancla en sí: este bloque fue de pruebas, métricas y documentación.

---

## 4. Qué contarme
1. Si la pantalla de Métricas y la descarga funcionaron en tu celular (y dónde quedó el archivo).
2. Si la fluidez se siente igual o mejor.
3. Si estás de acuerdo con las interpretaciones de §2.
4. Cuándo harás las sesiones con las 3 personas (puedo prepararte un guion corto para leerles).
