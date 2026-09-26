import { PRODUCTOS_INICIALES } from "@/lib/datos";
import { DetalleProducto } from "./detalle-producto";

// Exportación estática (GitHub Pages): una página por producto de la demo; no hay otros.
export function generateStaticParams() {
  return PRODUCTOS_INICIALES.map((p) => ({ id: p.id }));
}
export const dynamicParams = false;

// En Next 16, `params` es una promesa (ver node_modules/next/dist/docs, Dynamic Segments).
export default async function PaginaProducto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetalleProducto id={id} />;
}
