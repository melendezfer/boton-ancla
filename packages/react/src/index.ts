// API pública del adaptador React (spec §7).
export { AnchorProvider, useAnchorLayer, useAnchorReserva, useAnchorScreen, type ReservaAncla } from "./AnchorProvider";
export { reiniciarBienvenida } from "./dom/bienvenida";
export { useTeclado, type EstadoTeclado } from "./dom/entorno";
export { useMedidas, type Medidas } from "./dom/medidas";
export type { AnchorIcons, AnchorProviderProps, AnchorTheme, ReactAnchorIcon } from "./types";
