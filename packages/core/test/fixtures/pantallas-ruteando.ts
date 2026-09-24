import type { AnchorAction, AnchorScreen } from "../../src/types";

// Las 4 pantallas de ejemplo de spec §8. En el núcleo los íconos son solo
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
    accion("mi-ubicacion", "Mi ubicación", { priority: 2 }),
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
  actions: [
    accion("agregar-plato", "Agregar plato", { priority: 1 }),
    accion("marcar-no-disponible", "Marcar no disponible", {
      priority: 2,
      kind: "reversible",
      onUndo: nada,
      undoMessage: "Marcado no disponible",
    }),
    accion("editar", "Editar", { priority: 3 }),
  ],
};

export const productoDueno: AnchorScreen = {
  id: "producto",
  sectionIcon: "Cube",
  sectionLabel: "Detalle de producto",
  back: { onSelect: nada },
  actions: [
    accion("editar", "Editar", { priority: 1 }),
    accion("eliminar", "Eliminar", { priority: 2, kind: "irreversible" }),
  ],
};

export const pantallasSpec8 = [mapa, perfilVisitante, perfilDueno, productoDueno];

export { accion };
