# Prueba de HM-16: imán fuerte en el mapa

Qué cambió, qué hacer con el pulgar en el Nubia y qué deberías sentir. Para abrir la demo publicada o levantarla en local, ver `estado.md` §4–§5.

## Qué cambió (RF-24, spec 0.19)

Con **"Imán fuerte en el mapa"** activado (lo está por defecto en la demo):

| | Imán normal (antes) | Imán fuerte (nuevo) |
|---|---|---|
| Desde qué distancia atrapa un pin | 28 px | **44 px** (≈ 1,6 veces) |
| Freno del joystick | 0,35 igual en todo el radio | de 0,35 en el borde a **0,1 sobre el pin** |
| Cuándo va el pin a la mira | solo con el pulgar **quieto** | **apenas entra al radio**, aunque sigas moviendo el pulgar (80 ms) |
| Vibración (Android) | 10 ms | **25 ms** al enganchar, un "clic" más firme |

El enganche pasa **una vez por pin**: si sigues empujando, el pin se va (frenado) y no te atrapa.

## Qué hacer

1. **Mapa.** Presiona el ancla y desliza hacia abajo para mover el mapa (joystick).
2. Lleva la mira hacia un negocio **sin detenerte**, pasando cerca de él.
   - **Deberías sentir:** el pin **salta a la mira** antes de llegar, con un clic (vibración), y el mapa se pone "pesado" cerca de él.
3. **Suelta frenado** (pulgar de vuelta al centro): se abre el negocio, como siempre.
4. Otra vez: engánchalo y **sigue empujando**. El pin se va despacio; no queda pegado.
5. **Comparar:** Ajustes → apaga **"Imán fuerte en el mapa"** y repite 1–4. Luego vuelve a encenderlo.
6. Prueba también cerca de **pines juntos** (La Esquinita: tienda y droguería): no debería engancharse el equivocado.

## Qué contarme

1. ¿El fuerte **se siente como imán**? ¿Mejor que el normal?
2. ¿El salto del pin es **demasiado brusco** o está bien?
3. ¿Alguna vez te **costó salir** de un pin?
4. ¿La vibración se nota? ¿Es mucha?
5. ¿Te quedas con el fuerte, con el normal o con algo intermedio? (Si es intermedio, dime qué: más o menos radio, más o menos freno.)
