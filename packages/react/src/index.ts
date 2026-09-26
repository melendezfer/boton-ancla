// API pública del adaptador React (spec §7).
export {
  AnchorProvider,
  useAnchorLayer,
  useAnchorReserva,
  useAnchorScreen,
  useAnchorPan,
  useAnchorScroll,
  type ObjetivoDesplazar,
  type ObjetivoLibre,
  type ObjetivoApuntable,
  type OpcionesApuntar,
  type ReservaAncla,
} from "./AnchorProvider";
export type { CapaReact } from "./dom/capas";
export { reiniciarBienvenida } from "./dom/bienvenida";
export { useTeclado, type EstadoTeclado } from "./dom/entorno";
export { useMedidas, type Medidas } from "./dom/medidas";
export type { AnchorIcons, AnchorProviderProps, AnchorTheme, GuiaDesplazar, ReactAnchorIcon } from "./types";
