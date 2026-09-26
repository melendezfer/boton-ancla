import type { AnchorAction, AnchorScreen } from "@boton-ancla/core";
import { ANCHOR_ICONS, SEMANTIC_ICONS } from "./icons/semantic-icons";

// Definiciones de las pantallas del ancla (spec §8, design.md §8).
// Son funciones puras: reciben qué hacer en cada acción y devuelven el AnchorScreen.
// Así se prueban con validateScreen sin navegador, y en T-24 solo se conectan al ancla.

type Hacer = () => void;

export type AccionesMapa = {
  buscar: Hacer;
  miUbicacion: Hacer;
  ofertasCerca: Hacer;
  favoritos: Hacer;
  /** HM-12a (RF-20): un paso de zoom (toque y teclado). */
  zoomPaso: Hacer;
  /** HM-12a (RF-20): zoom continuo al quedarse sobre la opción. */
  zoomDeslizar: (paso: number) => void;
};
export type AccionesPerfilVisitante = { carta: Hacer; comoLlegar: Hacer; favorito: Hacer; compartir: Hacer; atras: Hacer };
export type AccionesPerfilDueno = { agregarPlato: Hacer; editar: Hacer; atras: Hacer };
export type AccionesCarta = { compartir: Hacer; favorito: Hacer; atras: Hacer };
export type AccionesProducto = { editar: Hacer; marcarNoDisponible: Hacer; deshacerNoDisponible: Hacer; eliminar: Hacer; atras: Hacer };

function accion(id: string, label: string, icon: AnchorAction["icon"], onSelect: Hacer, extra: Partial<AnchorAction> = {}): AnchorAction {
  return { id, label, icon, onSelect, ...extra };
}

export function pantallaMapa(a: AccionesMapa): AnchorScreen {
  return {
    id: "mapa",
    sectionIcon: ANCHOR_ICONS.sectionMap,
    sectionLabel: "Mapa",
    actions: [
      accion("buscar", "Buscar", ANCHOR_ICONS.search, a.buscar, { priority: 1 }),
      accion("mi-ubicacion", "Mi ubicación", ANCHOR_ICONS.myLocation, a.miUbicacion, { priority: 2, atTop: true }), // RF-22: 90° sin "Atrás"
      accion("ofertas-cerca", "Ofertas cerca", SEMANTIC_ICONS.offer, a.ofertasCerca, { priority: 3 }),
      accion("favoritos", "Favoritos", ANCHOR_ICONS.favoritesList, a.favoritos, { priority: 4 }),
      accion("zoom", "Zoom", ANCHOR_ICONS.zoom, a.zoomPaso, {
        priority: 5,
        onSlide: a.zoomDeslizar,
        slideHint: "Mantén sobre Zoom para acercar o alejar",
      }),
    ],
  };
}

export function pantallaPerfilVisitante(a: AccionesPerfilVisitante, esFavorito: boolean): AnchorScreen {
  return {
    id: "perfil-negocio",
    sectionIcon: ANCHOR_ICONS.sectionBusiness,
    sectionLabel: "Perfil de negocio",
    back: { onSelect: a.atras },
    actions: [
      accion("carta", "Carta", SEMANTIC_ICONS.catalog, a.carta, { priority: 1 }),
      accion("como-llegar", "Cómo llegar", ANCHOR_ICONS.directions, a.comoLlegar, { priority: 2 }),
      accion("favorito", esFavorito ? "Quitar de favoritos" : "Favorito", ANCHOR_ICONS.favoriteToggle, a.favorito, { priority: 3 }),
      accion("compartir", "Compartir", ANCHOR_ICONS.share, a.compartir, { priority: 4 }),
    ],
  };
}

export function pantallaPerfilDueno(a: AccionesPerfilDueno): AnchorScreen {
  return {
    id: "perfil-negocio-dueno",
    sectionIcon: ANCHOR_ICONS.sectionBusiness,
    sectionLabel: "Perfil de negocio",
    back: { onSelect: a.atras },
    actions: [
      accion("agregar-plato", "Agregar plato", ANCHOR_ICONS.addDish, a.agregarPlato, { priority: 1 }),
      accion("editar", "Editar", ANCHOR_ICONS.edit, a.editar, { priority: 2 }),
    ],
  };
}

export function pantallaCarta(a: AccionesCarta, esFavorito: boolean): AnchorScreen {
  return {
    id: "carta",
    sectionIcon: SEMANTIC_ICONS.catalog,
    sectionLabel: "Carta",
    back: { onSelect: a.atras },
    actions: [
      accion("compartir", "Compartir", ANCHOR_ICONS.share, a.compartir, { priority: 1 }),
      accion("favorito", esFavorito ? "Quitar de favoritos" : "Favorito", ANCHOR_ICONS.favoriteToggle, a.favorito, { priority: 2 }),
    ],
  };
}

export function pantallaProducto(a: AccionesProducto, disponible: boolean): AnchorScreen {
  return {
    id: "producto",
    sectionIcon: ANCHOR_ICONS.sectionProduct,
    sectionLabel: "Detalle de producto",
    back: { onSelect: a.atras },
    actions: [
      accion("editar", "Editar", ANCHOR_ICONS.edit, a.editar, { priority: 1 }),
      accion("marcar-no-disponible", "Marcar no disponible", ANCHOR_ICONS.markUnavailable, a.marcarNoDisponible, {
        priority: 2,
        kind: "reversible",
        onUndo: a.deshacerNoDisponible,
        undoMessage: "Marcado no disponible",
        // Ya está no disponible: la opción se ve atenuada y no se puede ejecutar (C-09).
        disabled: !disponible,
      }),
      accion("eliminar", "Eliminar", ANCHOR_ICONS.delete, a.eliminar, { priority: 3, kind: "irreversible" }),
    ],
  };
}

/** Pantallas propias de la demo (fuera de §8): solo "Atrás", que va arriba (C-22). */
export function pantallaSoloAtras(id: string, sectionLabel: string, sectionIcon: AnchorScreen["sectionIcon"], atras: Hacer): AnchorScreen {
  return { id, sectionIcon, sectionLabel, back: { onSelect: atras }, actions: [] };
}
