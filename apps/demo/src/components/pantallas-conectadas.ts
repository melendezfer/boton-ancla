"use client";

import type { AnchorScreen } from "@boton-ancla/core";
import { useAnchorScreen } from "@boton-ancla/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { enfocarBuscador } from "@/components/hojas";
import { NEGOCIO_DEMO } from "@/lib/datos";
import { useDemo, useRegistrarPantalla } from "@/lib/demo-store";
import { ANCHOR_ICONS } from "@/lib/icons/semantic-icons";
import { acercarMapa, factorDePaso } from "@/lib/mapa-control";
import {
  pantallaCarta,
  pantallaMapa,
  pantallaPerfilDueno,
  pantallaPerfilVisitante,
  pantallaProducto,
  pantallaSoloAtras,
} from "@/lib/pantallas";

// Conecta las definiciones puras de lib/pantallas.ts con la demo (router y estado).
// Cada hook registra su pantalla en el ancla (useAnchorScreen) y en la barra de la demo.

/** Registra la pantalla en el ancla y en la barra de la demo. */
function useRegistrar(p: AnchorScreen) {
  useAnchorScreen(p);
  useRegistrarPantalla(p);
}

function useVolver() {
  const router = useRouter();
  return useCallback(() => (window.history.length > 1 ? router.back() : router.push("/mapa")), [router]);
}

export function usePantallaMapa(): AnchorScreen {
  const { abrirHoja, pedirRecentrar, avisar } = useDemo();
  const p = pantallaMapa({
    buscar: () => {
      enfocarBuscador(); // síncrono, dentro del gesto (L-04, HU-01)
      abrirHoja({ tipo: "buscar" });
    },
    miUbicacion: () => {
      pedirRecentrar();
      avisar("Centrado en tu ubicación (simulado)");
    },
    ofertasCerca: () => abrirHoja({ tipo: "ofertas" }),
    favoritos: () => abrirHoja({ tipo: "favoritos" }),
    zoomPaso: () => acercarMapa(1.5),
    zoomDeslizar: (paso) => acercarMapa(factorDePaso(paso)),
  });
  useRegistrar(p);
  return p;
}

export function usePantallaPerfil(): AnchorScreen {
  const { prefs, favoritos, alternarFavorito, abrirHoja, avisar } = useDemo();
  const router = useRouter();
  const atras = useVolver();
  const esFavorito = favoritos.includes(NEGOCIO_DEMO.id);
  const favorito = () => {
    alternarFavorito(NEGOCIO_DEMO.id);
    avisar(esFavorito ? "Quitado de favoritos" : "Agregado a favoritos");
  };
  const p =
    prefs.rol === "dueno"
      ? pantallaPerfilDueno({ agregarPlato: () => abrirHoja({ tipo: "agregar-plato" }), editar: () => abrirHoja({ tipo: "editar-negocio" }), atras })
      : pantallaPerfilVisitante(
          {
            carta: () => router.push("/negocio/carta"),
            comoLlegar: () => avisar("Abriendo indicaciones (simulado)"),
            favorito,
            compartir: () => avisar("Enlace copiado (simulado)"),
            atras,
          },
          esFavorito,
        );
  useRegistrar(p);
  return p;
}

export function usePantallaCarta(): AnchorScreen {
  const { favoritos, alternarFavorito, avisar } = useDemo();
  const atras = useVolver();
  const esFavorito = favoritos.includes(NEGOCIO_DEMO.id);
  const p = pantallaCarta(
    {
      compartir: () => avisar("Enlace de la carta copiado (simulado)"),
      favorito: () => {
        alternarFavorito(NEGOCIO_DEMO.id);
        avisar(esFavorito ? "Quitado de favoritos" : "Agregado a favoritos");
      },
      atras,
    },
    esFavorito,
  );
  useRegistrar(p);
  return p;
}

export function usePantallaProducto(productoId: string, disponible: boolean): AnchorScreen {
  const { abrirHoja, marcarDisponible, eliminarProducto, avisar } = useDemo();
  const router = useRouter();
  const atras = useVolver();
  const p = pantallaProducto(
    {
      editar: () => abrirHoja({ tipo: "editar-producto", productoId }),
      marcarNoDisponible: () => marcarDisponible(productoId, false),
      deshacerNoDisponible: () => marcarDisponible(productoId, true),
      eliminar: () => {
        eliminarProducto(productoId);
        avisar("Producto eliminado");
        router.push("/negocio/carta");
      },
      atras,
    },
    disponible,
  );
  useRegistrar(p);
  return p;
}

const SECCIONES_DEMO = {
  ajustes: { label: "Ajustes", icon: ANCHOR_ICONS.sectionSettings },
  metricas: { label: "Métricas", icon: ANCHOR_ICONS.sectionMetrics },
  diagnostico: { label: "Diagnóstico", icon: ANCHOR_ICONS.sectionDiagnostics },
} as const;

export function usePantallaDemo(id: keyof typeof SECCIONES_DEMO): AnchorScreen {
  const atras = useVolver();
  const { label, icon } = SECCIONES_DEMO[id];
  const p = pantallaSoloAtras(id, label, icon, atras);
  useRegistrar(p);
  return p;
}
