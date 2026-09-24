import { DetalleProducto } from "./detalle-producto";

// En Next 16, `params` es una promesa (ver node_modules/next/dist/docs, Dynamic Segments).
export default async function PaginaProducto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetalleProducto id={id} />;
}
