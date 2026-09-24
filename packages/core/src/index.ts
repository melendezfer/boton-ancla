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
export { proximoPlazo } from "./machine/deadline";
export {
  crearGeometria,
  ESTADOS_TRANSITORIOS,
  REPOSO,
  type AnchorEvent,
  type AnchorState,
  type CancelReason,
  type Geometry,
  type ModoEjecucion,
  type Presion,
  type Tecla,
  type TipoEstado,
} from "./machine/states";
export { transition } from "./machine/transition";
export { createAnchorMachine, type Listener, type Machine } from "./machine/machine";
export { derivarMetricas, type MetricEvent } from "./metrics";
export {
  BIENVENIDA_INICIAL,
  leerBienvenida,
  marcarDemostracion,
  mostrarEtiqueta,
  necesitaDemostracion,
  registrarUso,
  serializarBienvenida,
  type EstadoBienvenida,
} from "./welcome";
