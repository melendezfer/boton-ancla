# Pista junto al ancla (v0.8.0)

**Origen:** RUTEANDO, recorrido 25 · N25-10 (video de Jose, min 0:15, 1:51 y 3:36): la pista de bienvenida
"Desliza hacia una opción" salía encima del abanico, en medio de la pantalla, tapando contenido. Jose autorizó el
cambio en este repositorio el 2026-10-30.

## Requisitos

- **PJ-01** La pista (`tipo: "pista"`) va **junto al ancla**, del lado donde no están las opciones: justo debajo con
  el abanico hacia arriba, justo encima con el abanico hacia abajo; centrada en el ancla y corrida hacia adentro si no
  cabe. Así no tapa ninguna opción por ancha que sea (encima, una pista de 150 px tapaba la opción de ~160° en la
  primera prueba). Si de ese lado no cabe (ancla pegada al borde), va del otro lado, pegada al ancla.
- **PJ-02** Es pequeña: alto `BANDA_PISTA_ALTO` (24 px) y letra de 12 px.
- **PJ-03** Se desvanece sola a los `T_PISTA` ms (1800) desde que aparece; vuelve en la siguiente apertura mientras
  dure la bienvenida (HU-12). Con movimiento reducido, desaparece sin animar.
- **PJ-04** La banda de la opción preseleccionada y la de la sección siguen como estaban (encima del abanico).

## Gana / pierde / mejora

| Gana | Pierde o arriesga | Cómo mejorarlo |
|---|---|---|
| La pista ya no tapa el contenido y se lee donde está el pulgar. | Quien no la alcanza a leer en 1,8 s la vuelve a ver solo al abrir otra vez. | Medir si la bienvenida se completa igual (métrica `welcome`). |
