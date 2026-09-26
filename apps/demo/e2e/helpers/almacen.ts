import type { Page } from "@playwright/test";

// Siembra la bienvenida (HU-12) como ya completada: demostración hecha y todas las
// opciones de la demo con muchos usos. Las pruebas que no tratan de la bienvenida
// esperan el comportamiento normal (el nombre de la sección en la zona muerta).
// Registrar DESPUÉS del script que limpia localStorage: los scripts corren en orden.

const IDS = [
  "buscar", "mi-ubicacion", "ofertas-cerca", "favoritos",
  "carta", "como-llegar", "favorito", "compartir",
  "agregar-plato", "editar", "marcar-no-disponible", "eliminar",
  "atras", "deshacer",
  "zoom", "ver-perfil", "whatsapp", // HM-12a
];

export async function sinBienvenida(page: Page) {
  await page.addInitScript((ids) => {
    try {
      const usos = Object.fromEntries(ids.map((id) => [id, 99]));
      window.localStorage.setItem("boton-ancla:v1:bienvenida", JSON.stringify({ version: 1, demostracionHecha: true, usos }));
    } catch {}
  }, IDS);
}
