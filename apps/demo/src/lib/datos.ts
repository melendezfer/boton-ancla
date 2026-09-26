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

export type CategoriaOferta = "Comida" | "Bebidas";
export type Oferta = { id: string; titulo: string; negocio: string; categoria: CategoriaOferta; metros: number };

/** El negocio "de la demo": el que tiene perfil, carta y productos. */
export const NEGOCIO_DEMO: Negocio = { id: "arepas-dona-rosa", nombre: "Arepas Doña Rosa", categoria: "Comida rápida", x: 1000, y: 1000 };

export const NEGOCIOS: Negocio[] = [
  NEGOCIO_DEMO,
  { id: "jugos-el-parque", nombre: "Jugos El Parque", categoria: "Bebidas", x: 1180, y: 900 },
  { id: "empanadas-la-esquina", nombre: "Empanadas La Esquina", categoria: "Comida rápida", x: 860, y: 1130 },
  { id: "arreglos-maria", nombre: "Costuras y Arreglos María", categoria: "Servicios", x: 1260, y: 1160 },
  { id: "tinto-y-pan", nombre: "Tinto y Pan", categoria: "Panadería", x: 780, y: 880 },
  { id: "frutas-don-jose", nombre: "Frutas Don José", categoria: "Frutas", x: 1100, y: 1290 },
  // Más negocios, para que la lista de Favoritos sea larga y se pueda desplazar (HM-09).
  { id: "salchipapas-el-mono", nombre: "Salchipapas El Mono", categoria: "Comida rápida", x: 620, y: 760 },
  { id: "panaderia-la-espiga", nombre: "Panadería La Espiga", categoria: "Panadería", x: 1420, y: 720 },
  { id: "tamales-dona-luz", nombre: "Tamales Doña Luz", categoria: "Comida", x: 700, y: 1400 },
  { id: "raspados-el-polo", nombre: "Raspados El Polo", categoria: "Bebidas", x: 1460, y: 1340 },
  { id: "cerrajeria-express", nombre: "Cerrajería Express", categoria: "Servicios", x: 560, y: 1080 },
  { id: "buñuelos-la-abuela", nombre: "Buñuelos La Abuela", categoria: "Panadería", x: 1340, y: 560 },
  { id: "arepas-de-choclo", nombre: "Arepas de Choclo Don Pedro", categoria: "Comida rápida", x: 900, y: 600 },
  { id: "tienda-la-esquinita", nombre: "Tienda La Esquinita", categoria: "Tienda", x: 1560, y: 1020 },
  { id: "mazamorra-dona-ana", nombre: "Mazamorra Doña Ana", categoria: "Postres", x: 760, y: 1560 },
  { id: "cafe-el-molino", nombre: "Café El Molino", categoria: "Bebidas", x: 1240, y: 1500 },
  // HM-12a: pines muy juntos, para probar grupos (a 16 px no se separan con el zoom inicial)…
  { id: "drogueria-la-esquinita", nombre: "Droguería La Esquinita", categoria: "Droguería", x: 1574, y: 1028 },
  // …y dos vecinos a 36 px, para probar que el imán se achica sin formar grupo.
  { id: "helados-don-jose", nombre: "Helados Don José", categoria: "Postres", x: 1136, y: 1290 },
];

/** Favoritos con los que empieza la demo (sin el negocio de la demo, que se marca a mano). */
export const FAVORITOS_INICIALES = NEGOCIOS.filter((n) => n.id !== "arepas-dona-rosa").map((n) => n.id);

export const PRODUCTOS_INICIALES: Producto[] = [
  { id: "arepa-queso", nombre: "Arepa de queso", precio: 4000, descripcion: "Arepa de maíz asada con queso campesino.", disponible: true, eliminado: false },
  { id: "arepa-rellena", nombre: "Arepa rellena", precio: 7500, descripcion: "Con carne desmechada, pollo o mixta.", disponible: true, eliminado: false },
  { id: "chocolate", nombre: "Chocolate caliente", precio: 3000, descripcion: "Con queso y pan aparte.", disponible: true, eliminado: false },
  { id: "empanada", nombre: "Empanada de pipián", precio: 2500, descripcion: "Con ají de la casa.", disponible: false, eliminado: false },
  // Más platos, para que la carta sea larga y se pueda desplazar (HM-09).
  { id: "arepa-huevo", nombre: "Arepa de huevo", precio: 5500, descripcion: "Frita, con huevo adentro.", disponible: true, eliminado: false },
  { id: "arepa-choclo", nombre: "Arepa de choclo", precio: 6000, descripcion: "Dulce, con queso.", disponible: true, eliminado: false },
  { id: "caldo", nombre: "Caldo de costilla", precio: 9000, descripcion: "Solo hasta las 10 a. m.", disponible: true, eliminado: false },
  { id: "tamal", nombre: "Tamal tolimense", precio: 10000, descripcion: "Con chocolate.", disponible: true, eliminado: false },
  { id: "pandebono", nombre: "Pandebono", precio: 1500, descripcion: "Recién horneado.", disponible: true, eliminado: false },
  { id: "almojabana", nombre: "Almojábana", precio: 1500, descripcion: "De cuajada.", disponible: true, eliminado: false },
  { id: "jugo-lulo", nombre: "Jugo de lulo", precio: 3500, descripcion: "En agua o en leche.", disponible: true, eliminado: false },
  { id: "avena", nombre: "Avena fría", precio: 3000, descripcion: "Con canela.", disponible: true, eliminado: false },
  { id: "tinto", nombre: "Tinto", precio: 1000, descripcion: "Café negro.", disponible: true, eliminado: false },
  { id: "aromatica", nombre: "Aromática", precio: 1500, descripcion: "De frutas.", disponible: true, eliminado: false },
];

// En orden "de llegada" (no por distancia), para que "Ordenar por distancia" cambie algo.
export const OFERTAS: Oferta[] = [
  { id: "o3", titulo: "Empanada + gaseosa $4.500", negocio: "Empanadas La Esquina", categoria: "Comida", metros: 310 },
  { id: "o2", titulo: "Jugo en agua a $3.000 hasta las 11", negocio: "Jugos El Parque", categoria: "Bebidas", metros: 240 },
  { id: "o1", titulo: "2 arepas de queso por $7.000", negocio: "Arepas Doña Rosa", categoria: "Comida", metros: 120 },
  { id: "o4", titulo: "Tinto + pan de bono $2.500", negocio: "Tinto y Pan", categoria: "Bebidas", metros: 450 },
  // Más ofertas, para que la lista sea larga y se pueda desplazar (HM-09).
  { id: "o5", titulo: "Salchipapa mediana $8.000", negocio: "Salchipapas El Mono", categoria: "Comida", metros: 520 },
  { id: "o6", titulo: "Raspado doble al precio de uno", negocio: "Raspados El Polo", categoria: "Bebidas", metros: 680 },
  { id: "o7", titulo: "Tamal + chocolate $11.000", negocio: "Tamales Doña Luz", categoria: "Comida", metros: 390 },
  { id: "o8", titulo: "3 buñuelos por $3.000", negocio: "Buñuelos La Abuela", categoria: "Comida", metros: 760 },
  { id: "o9", titulo: "Café grande al precio del pequeño", negocio: "Café El Molino", categoria: "Bebidas", metros: 205 },
  { id: "o10", titulo: "Arepa de choclo con queso $6.000", negocio: "Arepas de Choclo Don Pedro", categoria: "Comida", metros: 610 },
  { id: "o11", titulo: "Mazamorra + panela $4.000", negocio: "Mazamorra Doña Ana", categoria: "Comida", metros: 880 },
  { id: "o12", titulo: "Limonada de coco $5.000", negocio: "Jugos El Parque", categoria: "Bebidas", metros: 260 },
];

export const CATEGORIAS_OFERTA: ("Todas" | CategoriaOferta)[] = ["Todas", "Comida", "Bebidas"];

export function formatoPesos(valor: number): string {
  return `$${valor.toLocaleString("es-CO")}`;
}
