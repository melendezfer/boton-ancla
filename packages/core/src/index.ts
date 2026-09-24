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
export {
  anguloDesde,
  anguloParaMano,
  distancia,
  normalizarAngulo,
  puntoEnDireccion,
  reflejarAngulo,
} from "./geometry";
export {
  assignActions,
  computeAnchorPosition,
  computeFanLayout,
  layoutParaPantalla,
  orderActions,
  radioAdaptativo,
  type FanLayout,
  type FanSlot,
  type OrderedAction,
  type Slot,
} from "./layout";
export { resolveSelection, type Seleccion } from "./selection";
