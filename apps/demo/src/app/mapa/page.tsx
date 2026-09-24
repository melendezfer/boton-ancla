"use client";

import { MapaFalso } from "@/components/mapa-falso";
import { usePantallaMapa } from "@/components/pantallas-conectadas";

export default function PaginaMapa() {
  usePantallaMapa();
  return <MapaFalso />;
}
