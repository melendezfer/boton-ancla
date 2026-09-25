# Pruebas manuales y mediciones — Fase 1 (T-27)

Registro de la prueba manual obligatoria (spec §10.3) y de las mediciones de contraste (RNF-06) y rendimiento (RNF-03).
**Criterio de salida de la Fase 1** (spec §10): todas las pruebas pasan, la lista manual está completa y hay registro de **al menos 3 personas**, incluida una que use **solo deslizamiento**.

Estado: ⏳ **faltan las 3 personas** (tabla §3). Lo automático ya está medido (§4 y §5).

---

## 1. Cómo hacer una sesión

1. Levantar la demo y abrirla en el celular (`estado.md` §4 y §5).
2. En **Métricas → Borrar registros**, para empezar limpio.
3. En **Ajustes**, elegir la mano de la persona y "Repetir la bienvenida" (así también se prueba HU-12).
4. Pedirle que recorra la lista de §2 **con una sola mano**, sin explicarle más de lo necesario.
5. Al terminar, en **Métricas**: escribir el dispositivo y las observaciones, y **Descargar JSON**. Guardar el archivo como `specs/fase-1/sesiones/<fecha>-<persona>.json` (sin nombres reales: "P1", "P2", …).
6. Completar la fila de la persona en §3.

---

## 2. Lista de spec §10.3

| # | Qué probar | Qué debería pasar |
|---|---|---|
| 1 | Abrir y ejecutar las 4–5 opciones de cada pantalla con una sola mano | Cada una hace lo suyo; el ancla vuelve a reposo enseguida |
| 2 | Cambiar de opción sin soltar; cancelar volviendo al centro | La preselección sigue al dedo; volver al centro y soltar no hace nada |
| 3 | Descansar el pulgar mientras se lee | Aparece un anillo suave; no se abre nada |
| 4 | Hacer todo **solo deslizando**, sin ningún toque | Incluidos Atrás, Eliminar (más allá del anillo) y Deshacer |
| 5 | Modo experto: deslizamientos rápidos sin mirar | Se ejecuta la opción de esa dirección |
| 6 | Irreversible: soltar sobre "Eliminar" no elimina; deslizar más allá sí | Aviso "Desliza más allá para confirmar"; más allá elimina |
| 7 | Gesto "atrás" de Android y barra de inicio de iOS cerca del ancla | No se confunden con el ancla |
| 8 | Mantener presionado sin lupa ni selección de texto de iOS | Nada de eso aparece |
| 9 | Probar con mano izquierda | Todo reflejado; Atrás sigue arriba |
| 10 | Legibilidad del ancla translúcida sobre mapa claro, foto y oscuro | Se distingue en los tres |
| 11 | Anotar qué se sintió lento, confuso o incómodo | En "Observaciones" de Métricas |

---

## 3. Registro por persona (a completar)

Marca ✅ / ⚠️ / ❌ por punto de §2. "Solo deslizando" = la persona no usó ningún toque.

| Persona | Fecha | Dispositivo / navegador | Mano | Solo deslizando | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Observaciones | JSON |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | | | | | | | | | | | | | | | | |
| P2 | | | | | | | | | | | | | | | | |
| P3 (solo deslizando) | | | | sí | | | | | | | | | | | | |

### Lo ya reportado por el desarrollador (no cuenta como una de las 3 personas)
| Fecha | Dispositivo | Qué | Resultado |
|---|---|---|---|
| 24-09-2026 | Nubia Neo 3 GT (Android) | Demo T-12 en el celular por la red local | Carga bien (portproxy 3002) |
| 24-09-2026 | Nubia Neo 3 GT | Altura del ancla (HM-01) | 30 % baja → 38 % |
| 24-09-2026 | Nubia Neo 3 GT | Etiquetas del abanico (HM-02) | Se tapaban → banda fija encima del abanico |
| 24-09-2026 | Nubia Neo 3 GT | Bloque C completo | "Todo va muy bien; se puede tocar y también arrastrar para seleccionar"; altura 38 % aún baja → 44 % |

---

## 4. Contraste (RNF-06) — medido automáticamente

Prueba: `apps/demo/src/lib/contraste.test.ts` (Vitest, fórmula WCAG 2.x, tokens reales de la demo). El reposo es translúcido: `surface` al 60 % mezclado con el fondo real.

| Qué | Mínimo | Peor caso medido |
|---|---|---|
| Ícono del ancla en reposo (`text` sobre `surface` 60 %) | 3:1 | **6,05:1** (sobre negro); 6,56 foto oscura; 7,40 mapa oscuro; 15,5 mapa claro |
| Ícono violeta en reposo (lo que evitó C-02) | 3:1 | 2,15:1 ❌: por eso el reposo usa `text` |
| Ancla activa, opciones, opción preseleccionada | 3:1 | ≥ 6:1 |
| Banda (nombre, sección o pista), avisos, "Confirmar" | 4,5:1 | ≥ 6:1 |

**Límite:** el desenfoque (`backdrop-filter`) y las fotos reales con zonas muy mezcladas pueden cambiar el resultado. Se confirma a ojo con el punto 10 de §2 (fondos claro, foto y oscuro en Ajustes). Para probar con una foto real: guardar una imagen en `apps/demo/public/fondos/foto.jpg`.

---

## 5. Rendimiento (RNF-03) — medición indicativa

Medición: `apps/demo/e2e/rendimiento.spec.ts` (`npm run e2e:rendimiento -w demo`). Chromium (Pixel 7 emulado) en WSL, recorriendo el abanico de lado a lado durante ~1,2 s, con la CPU frenada por el protocolo de DevTools.

| CPU | Cuadros/s | p50 | p95 | Cuadro más largo | Cuadros > 25 ms |
|---|---|---|---|---|---|
| ×1 | 60 | 16,7 ms | 16,8 ms | 16,8 ms | 0 % |
| ×4 | 55 | 16,7 ms | 16,8 ms | 100 ms | 4 % |
| ×6 | 51 | 16,7 ms | 33,3 ms | 167 ms | 6 % |

Antes de la optimización (el ancla se redibujaba en cada movimiento del dedo), con ×4 el p95 era 33,3 ms y con ×6 50,1 ms (13 % de cuadros largos).

**Conclusión:** a velocidad normal, 60 cuadros/s estables. Con la CPU muy frenada quedan cuadros sueltos largos, probablemente al abrir el menú (se dibuja el abanico entero). **Falta medir en un Android de gama baja real** (L-08): Chrome → `chrome://inspect` desde el PC → pestaña Performance mientras se usa el ancla. Si se confirma, se puede montar el abanico de antemano, oculto, para que abrirlo no tenga que crear elementos.

---

## 6. Hallazgos nuevos de estas sesiones

Si algo de una sesión obliga a cambiar la spec, se registra como **HM-xx** en `spec.md` §12 y aquí se anota el enlace.

| ID | Sesión | Resumen |
|---|---|---|
| | | |
