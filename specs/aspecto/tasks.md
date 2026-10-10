# Tareas — aspecto en reposo (v0.4)

- [x] TA-1 Parámetros nuevos y valores (DA-05) con su validación.
- [x] TA-2 Núcleo: `aspectoEnReposo` y `desplazamientoRecogida` con pruebas (Vitest).
- [x] TA-3 Adaptador: temporizadores del aspecto, clases `ba-ancla--encendida` / `--recogida` / latido, y el corrimiento visual (DA-02, DA-06).
- [x] TA-4 Adaptador: ignorar el toque fuera del círculo (RA-06, DA-04).
- [x] TA-5 CSS: semitransparencia, latido con movimiento reducido, recogida animada.
- [x] TA-6 E2E en la demo: encendida → translúcida → recogida con el reloj de Playwright; el gesto funciona recogida; un toque en la esquina de la caja no la activa.
- [x] TA-7 Demo: control para ver el recogido sin esperar (y versión 0.4.0 con su etiqueta).

## v0.5 (RA-09)

- [x] TA-8 Parámetros `D_GUARDAR` y `T_GUARDAR` (spec §6) y `esGestoGuardar` en el núcleo con pruebas.
- [x] TA-9 Adaptador: medir el gesto y recoger al volver a reposo.
- [x] TA-10 E2E: guardar con el gesto (sin abrir ni ejecutar nada) y sacarla después; un deslizamiento hacia adentro no la guarda.
