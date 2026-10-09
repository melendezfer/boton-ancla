# Prueba manual — aspecto en reposo (v0.4)

En el celular (`npm run lan`, `https://<IP>:3002`) y en el PC. Para no esperar 15 s, en
**Ajustes → Recogerse al borde** baja el tiempo a 2 s.

| # | Qué hacer | Qué debe pasar |
|---|---|---|
| 1 | Abre el mapa y mira el ancla sin tocarla | Círculo semitransparente: se ve el mapa a través; cada ~4 s un brillo sutil |
| 2 | Activa "reducir movimiento" en el teléfono | Ya no late |
| 3 | Espera el tiempo de recogerse | Se corre al borde y queda medio escondida |
| 4 | Toca o desliza desde la mitad visible | Se abre el abanico en su lugar de siempre |
| 5 | Cierra el menú | Queda encendida (sólida) unos 3 s y vuelve a translúcida |
| 6 | Toca justo fuera del círculo (en diagonal, cerca del borde) | No pasa nada |
| 7 | Sexta opción, tocar un lado u otro, deslizar y soltar | Igual que antes |
