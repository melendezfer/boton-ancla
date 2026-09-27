"use client";

import { orientacionDe, type Orientacion } from "@boton-ancla/core";
import { useEffect, useState } from "react";

/** Fase 3: vertical u horizontal según la ventana (el mismo criterio que el ancla). */
export function useOrientacionVentana(): Orientacion {
  const [o, setO] = useState<Orientacion>("vertical");
  useEffect(() => {
    const leer = () => setO(orientacionDe(window.innerWidth, window.innerHeight));
    leer();
    window.addEventListener("resize", leer);
    return () => window.removeEventListener("resize", leer);
  }, []);
  return o;
}
