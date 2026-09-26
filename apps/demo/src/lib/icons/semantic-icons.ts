import type { Icon } from "@phosphor-icons/react";
import {
  ArrowCounterClockwise,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  CaretDoubleDown,
  Broadcast,
  ChartBar,
  CheckCircle,
  Crosshair,
  Cube,
  DoorOpen,
  Eraser,
  Funnel,
  GearSix,
  Heart,
  IdentificationCard,
  Keyboard,
  ListHeart,
  MagnifyingGlass,
  MagnifyingGlassPlus,
  MapPin,
  MapPinArea,
  MapTrifold,
  MinusCircle,
  NavigationArrow,
  PencilSimple,
  PlusCircle,
  SealCheck,
  ShareNetwork,
  ShoppingCartSimple,
  SortAscending,
  Stethoscope,
  Storefront,
  Tag,
  TextAa,
  Trash,
  WhatsappLogo,
  Umbrella,
  X,
} from "@phosphor-icons/react/dist/ssr";

/**
 * Registro ÚNICO de "qué significa cada ícono" en la demo (RNF-09).
 * Regla: cada ícono representa UNA sola cosa. Antes de usar uno para algo
 * nuevo, se agrega aquí; si ya está tomado, se elige otro.
 * La prueba semantic-icons.test.ts verifica que ningún ícono se repita.
 */

/** Copia del registro de RUTEANDO (client/src/lib/icons/semantic-icons.ts). */
export const SEMANTIC_ICONS = {
  /** Oferta con vigencia, genérica. En la demo: "Ofertas cerca". */
  offer: Tag,
  /** El catálogo permanente del negocio ("Carta"). También es el ícono de la sección Carta: mismo significado. */
  catalog: BookOpen,
  businessName: TextAa,
  openNow: DoorOpen,
  confirmedSelling: SealCheck,
  liveLocation: Broadcast,
  /** Acción completada con éxito. */
  success: CheckCircle,
} satisfies Record<string, Icon>;

/** Modalidad del negocio (copia de RUTEANDO). Storefront = "local fijo"; nunca para secciones (C-16). */
export const MOBILITY_ICONS = {
  itinerant: ShoppingCartSimple,
  street_stall: Umbrella,
  fixed: Storefront,
} satisfies Record<string, Icon>;

/** Íconos nuevos del botón-ancla (spec §8, C-15, C-16, C-21). */
export const ANCHOR_ICONS = {
  // Secciones: lo que muestra el centro del ancla (D-09).
  sectionMap: MapTrifold,
  /** Perfil de negocio. No Storefront (= local fijo). */
  sectionBusiness: IdentificationCard,
  /** Detalle de producto. No Package (= Combo en RUTEANDO). */
  sectionProduct: Cube,
  sectionSettings: GearSix,
  sectionMetrics: ChartBar,
  sectionDiagnostics: Stethoscope,

  // Acciones del abanico.
  search: MagnifyingGlass,
  myLocation: Crosshair,
  /** Marcar o desmarcar un negocio como favorito. */
  favoriteToggle: Heart,
  /** Ver la lista de Favoritos (distinto de marcar, C-16). */
  favoritesList: ListHeart,
  share: ShareNetwork,
  directions: NavigationArrow,
  edit: PencilSimple,
  delete: Trash,
  back: ArrowLeft,
  /** Deshacer la última acción reversible (C-21). */
  undo: ArrowCounterClockwise,
  addDish: PlusCircle,
  /** Marcar un plato/producto como no disponible (C-15). Libre en RUTEANDO. */
  markUnavailable: MinusCircle,

  /** Cerrar lo que está abierto encima (hojas, listas): la X de las hojas y "Cerrar" del ancla (HM-03). */
  close: X,
  /** Bajar el teclado virtual (quitar el foco del campo), que agrega el ancla (HM-06, RF-17). */
  hideKeyboard: CaretDoubleDown,
  /** Flechas del ancla al desplazar con ella (HM-10, variante "ancla"). */
  scrollUp: ArrowUp,
  scrollDown: ArrowDown,

  // Acciones de capa de la demo (HM-08).
  /** Enfocar el campo de texto para escribir (abre el teclado). */
  write: Keyboard,
  /** Borrar el texto escrito en un campo. */
  clearText: Eraser,
  /** Ordenar una lista. */
  sort: SortAscending,
  /** Filtrar una lista por categoría. */
  filter: Funnel,
  /** Ver en el mapa los elementos de una lista. */
  showOnMap: MapPinArea,

  // Solo de la demo.
  /** Pin de un negocio en el mapa falso. */
  mapPin: MapPin,
  /** Zoom del mapa: deslizador del abanico (HM-12a, RF-20). */
  zoom: MagnifyingGlassPlus,
  /** Escribir al negocio por WhatsApp (capa de un pin elegido, HM-12a). */
  whatsapp: WhatsappLogo,
} satisfies Record<string, Icon>;
