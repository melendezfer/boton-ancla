# Pruebas E2E de la demo

Playwright con emulación táctil (spec §10.2). Dos proyectos:
- **pixel-7**: Chromium con toques **reales** (protocolo de DevTools).
- **iphone-14**: WebKit de escritorio con tamaño de iPhone y `PointerEvent` sintéticos. **No es Safari de iOS** (L-07): la prueba manual en un iPhone real sigue siendo obligatoria.

```bash
cd ~/boton-ancla
npm run e2e                                                  # todo (reutiliza la demo si está corriendo en 3002)
cd apps/demo && npx playwright test e2e/t16-gesto.spec.ts    # un archivo
npx playwright show-report                                   # reporte de la última corrida
```

## Ayudas (`helpers/`)
| Archivo | Para qué |
|---|---|
| `gestos.ts` | `presionar / mover / soltar / deslizar` con uno o dos dedos. Sin `tap()`: sirve para las pruebas "solo deslizando". |
| `ancla.ts` | Lee `data-geometria` del ancla para apuntar a cada opción, incluso con el menú cerrado. |
| `almacen.ts` | `sinBienvenida()`: marca la bienvenida como completada, para las pruebas que no tratan de ella. |

## Historias de usuario → pruebas

| HU | Qué | Archivo(s) |
|---|---|---|
| HU-01 | Ejecutar con un solo gesto (Buscar + teclado; reposo al instante) | `t16-gesto`, `t26-solo-deslizando` |
| HU-02 | Cambiar de opción sin levantar el dedo | `t16-gesto` |
| HU-03 | Cancelar volviendo al centro | `t16-gesto`, `t25-metricas` |
| HU-04 | Descansar el pulgar | `t17-descanso` |
| HU-05 | Modo toque | `t18-toque` |
| HU-06 | Modo experto (deslizamiento relámpago) | `t16-gesto` |
| HU-07 | Acción reversible con deshacer | `t19-sensibles`, `t26-solo-deslizando` |
| HU-08 | Irreversible: deslizar más allá | `t19-sensibles`, `t26-solo-deslizando` |
| HU-09 | Todo solo deslizando | `t26-solo-deslizando` (recorre todas las acciones de §8), `t18-toque` |
| HU-10 | Saber dónde estoy (ícono de sección) | `t24-pantallas`, `t15-reposo` |
| HU-11 | Mano izquierda | `t22-mano-izquierda` |
| HU-12 | Primeros usos (demostración y pistas) | `t23-bienvenida` |
| HU-13 | No interferir con el mapa | `t16-gesto` |

## Requisitos con prueba propia
| Requisito | Archivo |
|---|---|
| RF-06b / HM-02 (banda de etiqueta) | `t16-gesto`, `t18-toque`, `t23-bienvenida` |
| RF-07 (anillo exterior) | `t16-gesto`, `t19-sensibles` |
| RF-09 / RF-10 (segundo dedo, orientación, cambio de sección) | `t20-entorno` |
| RF-11 (tocar fuera no llega al contenido) | `t18-toque` |
| RF-12 / RF-14 (dentro de pantalla, sobre las hojas) | `t15-reposo`, `humo` |
| RF-13 (teclado abierto) | `t20-entorno` |
| RNF-02 (sin menú contextual, `touch-action`) | `t15-reposo` |
| RNF-04 (movimiento reducido) | `t21-teclado` |
| RNF-05 (teclado, lector de pantalla) | `t21-teclado` |
| RNF-08 (métricas locales, sin red) | `t25-metricas` |
| HM-01 (altura del ancla) | `humo` |

**Sin E2E:** C-19 (aviso de error cuando una acción asíncrona falla), porque ninguna acción de la demo es asíncrona.
