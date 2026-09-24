// API pública del núcleo del botón-ancla (spec §7).
// Cada módulo se agrega aquí a medida que se implementa (ver specs/fase-1/tasks.md).
export type {
  ActionKind,
  AnchorAction,
  AnchorIcon,
  AnchorPrefs,
  AnchorScreen,
  Hand,
  Insets,
  Point,
  Rect,
} from "./types";
export { DEFAULT_PARAMS, type Desempate, type Params } from "./params";
export { ID_ATRAS, ID_DESHACER, validateScreen } from "./validate";
