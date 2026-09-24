// Datos simulados de la demo. Nada sale a la red.

export type Negocio = {
  id: string;
  nombre: string;
  categoria: string;
  /** Posición en el lienzo del mapa falso, en px. */
  x: number;
  y: number;
};

export type Producto = {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  disponible: boolean;
  eliminado: boolean;
};

export type Oferta = { id: string; titulo: string; negocio: string; distancia: string };

/** El negocio "de la demo": el que tiene perfil, carta y productos. */
export const NEGOCIO_DEMO: Negocio = { id: "arepas-dona-rosa", nombre: "Arepas Doña Rosa", categoria: "Comida rápida", x: 1000, y: 1000 };

export const NEGOCIOS: Negocio[] = [
  NEGOCIO_DEMO,
  { id: "jugos-el-parque", nombre: "Jugos El Parque", categoria: "Bebidas", x: 1180, y: 900 },
  { id: "empanadas-la-esquina", nombre: "Empanadas La Esquina", categoria: "Comida rápida", x: 860, y: 1130 },
  { id: "arreglos-maria", nombre: "Costuras y Arreglos María", categoria: "Servicios", x: 1260, y: 1160 },
  { id: "tinto-y-pan", nombre: "Tinto y Pan", categoria: "Panadería", x: 780, y: 880 },
  { id: "frutas-don-jose", nombre: "Frutas Don José", categoria: "Frutas", x: 1100, y: 1290 },
];

export const PRODUCTOS_INICIALES: Producto[] = [
  { id: "arepa-queso", nombre: "Arepa de queso", precio: 4000, descripcion: "Arepa de maíz asada con queso campesino.", disponible: true, eliminado: false },
  { id: "arepa-rellena", nombre: "Arepa rellena", precio: 7500, descripcion: "Con carne desmechada, pollo o mixta.", disponible: true, eliminado: false },
  { id: "chocolate", nombre: "Chocolate caliente", precio: 3000, descripcion: "Con queso y pan aparte.", disponible: true, eliminado: false },
  { id: "empanada", nombre: "Empanada de pipián", precio: 2500, descripcion: "Con ají de la casa.", disponible: false, eliminado: false },
];

export const OFERTAS: Oferta[] = [
  { id: "o1", titulo: "2 arepas de queso por $7.000", negocio: "Arepas Doña Rosa", distancia: "120 m" },
  { id: "o2", titulo: "Jugo en agua a $3.000 hasta las 11", negocio: "Jugos El Parque", distancia: "240 m" },
  { id: "o3", titulo: "Empanada + gaseosa $4.500", negocio: "Empanadas La Esquina", distancia: "310 m" },
];

export function formatoPesos(valor: number): string {
  return `$${valor.toLocaleString("es-CO")}`;
}
