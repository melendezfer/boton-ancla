# Diseño — aspecto en reposo (v0.4)

| ID | Decisión | Por qué |
|---|---|---|
| DA-01 | El núcleo decide el aspecto con una función pura `aspectoEnReposo(msDesdeUso, params)` → `encendida` / `translucida` / `recogida`, y cuánto correrse con `desplazamientoRecogida(centroX, anchoVista, params)`. El adaptador solo pone los temporizadores. | El núcleo no usa `window` ni temporizadores (RNF-07, D-18) y así se prueba con Vitest. |
| DA-02 | Recogida = `translateX` visual del botón hasta que su centro quede sobre el borde de su lado. La geometría (abanico, banda, avisos) se calcula siempre desde el centro de siempre. | "Sin perder el gesto": el abanico aparece donde la persona lo espera; el botón vuelve al tocarlo. |
| DA-03 | Latido con un `::after` (anillo) que anima `transform` y `opacity` en un ciclo de `T_LATIDO`; solo en reposo (translúcida y recogida). | RNF-03 (solo transform y opacity) y RNF-04 (sin movimiento con reducido). |
| DA-04 | RA-06 se garantiza en `bajarEnAncla`: si el punto cae fuera del radio visible (`D_REPOSO/2` + 2 px de tolerancia) se ignora. | Los navegadores no siempre recortan el toque por `border-radius`; con el botón corrido (recogida) la caja sigue siendo cuadrada. |
| DA-05 | Valores: `OPACIDAD_REPOSO` 0.45, `DESENFOQUE_REPOSO` 2, `T_ENCENDIDA` 3000, `T_RECOGER` 15000, `T_LATIDO` 4000, `RECOGER` true. | Pedido del usuario ("deja ver lo que hay debajo", "unos segundos", "otro rato"); ajustables por la app. |
| DA-06 | Al montar, el ancla arranca translúcida (no encendida) y empieza a contar para recogerse. | Encendida sin haberla usado no avisa nada nuevo. |
