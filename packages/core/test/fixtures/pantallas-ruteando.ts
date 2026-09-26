import type { AnchorAction, AnchorScreen } from "../../src/types";

// Las 5 pantallas de ejemplo de spec §8 (v0.3). En el núcleo los íconos son solo
// texto (AnchorIcon = unknown); la demo usará los componentes de Phosphor.

const nada = () => {};

function accion(id: string, label: string, extra: Partial<AnchorAction> = {}): AnchorAction {
  return { id, label, icon: id, onSelect: nada, ...extra };
}

export const mapa: AnchorScreen = {
  id: "mapa",
  sectionIcon: "MapTrifold",
  sectionLabel: "Mapa",
  actions: [
    accion("buscar", "Buscar", { priority: 1 }),
    accion("mi-ubicacion", "Mi ubicación", { priority: 2, atTop: true }), // RF-22: 90° sin "Atrás"
    accion("ofertas-cerca", "Ofertas cerca", { priority: 3 }),
    accion("favoritos", "Favoritos", { priority: 4 }),
  ],
};

export const perfilVisitante: AnchorScreen = {
  id: "perfil-negocio",
  sectionIcon: "IdentificationCard",
  sectionLabel: "Perfil de negocio",
  back: { onSelect: nada },
  actions: [
    accion("carta", "Carta", { priority: 1 }),
    accion("como-llegar", "Cómo llegar", { priority: 2 }),
    accion("favorito", "Favorito", { priority: 3 }),
    accion("compartir", "Compartir", { priority: 4 }),
  ],
};

export const perfilDueno: AnchorScreen = {
  id: "perfil-negocio-dueno",
  sectionIcon: "IdentificationCard",
  sectionLabel: "Perfil de negocio",
  back: { onSelect: nada },
  actions: [accion("agregar-plato", "Agregar plato", { priority: 1 }), accion("editar", "Editar", { priority: 2 })],
};

export const carta: AnchorScreen = {
  id: "carta",
  sectionIcon: "BookOpen",
  sectionLabel: "Carta",
  back: { onSelect: nada },
  actions: [accion("compartir", "Compartir", { priority: 1 }), accion("favorito", "Favorito", { priority: 2 })],
};

export const productoDueno: AnchorScreen = {
  id: "producto",
  sectionIcon: "Cube",
  sectionLabel: "Detalle de producto",
  back: { onSelect: nada },
  actions: [
    accion("editar", "Editar", { priority: 1 }),
    accion("marcar-no-disponible", "Marcar no disponible", {
      priority: 2,
      kind: "reversible",
      onUndo: nada,
      undoMessage: "Marcado no disponible",
    }),
    accion("eliminar", "Eliminar", { priority: 3, kind: "irreversible" }),
  ],
};

export const pantallasSpec8 = [mapa, perfilVisitante, perfilDueno, carta, productoDueno];

export { accion };
