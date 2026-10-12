# Carga diferida del ancla (v0.5.1)

Pedido de RUTEANDO (refactor R3, peso del build): el ancla viaja en todas sus pantallas aunque esté
apagada (lo está por defecto). Medido con `next experimental-analyze`: ~29 KB comprimidos por pantalla.

- **RC-01**: el adaptador no descarga el componente del ancla (`components/Ancla`, lo más pesado del
  paquete, con la máquina de estados y el trazado) hasta que alguna pantalla se registra
  (`useAnchorScreen`). Una app que nunca registra pantallas (ancla apagada) no lo descarga nunca.
- **RC-02**: una vez montado, no se desmonta aunque la pantalla se quite y llegue otra (conserva su
  estado: recogida, edición, bienvenida).
- **RC-03**: la API pública no cambia.

## Decisiones

- **DC-01**: `React.lazy` + `Suspense` con `fallback={null}` dentro del portal. El proveedor y los
  contextos siguen síncronos: los hijos no se vuelven a montar.
- **DC-02**: el estado `usado` se ajusta en el render (no en un efecto) para que el ancla aparezca en el
  mismo ciclo en que se registra la primera pantalla, salvo la descarga del trozo la primera vez.

## Riesgo y prueba

La primera vez que se enciende, el ancla aparece cuando termina de descargarse su trozo (en local, unos
milisegundos; con datos móviles, una fracción de segundo). Prueba: E2E completas de la demo y de RUTEANDO;
en el celular, encender el ancla y ver que aparece sin parpadeo raro.
