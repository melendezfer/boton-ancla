import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos } from "./helpers/gestos";

// T-24: el ancla en todas las pantallas de spec §8 (D-06, HU-10).

function prepararRol(page: Page, rol: "visitante" | "dueno") {
  return page.addInitScript((r) => {
    try {
      window.localStorage.clear();
      window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify({ rol: r }));
    } catch {}
  }, rol);
}

/** Ángulo de cada opción, redondeado, como en spec §8 + design.md §4.4. */
async function angulos(page: Page) {
  const g = await leerGeometria(page);
  return Object.fromEntries(g.slots.map((s) => [s.id, Math.round(s.angulo * 10) / 10]));
}

const CASOS = [
  { ruta: "/mapa", rol: "visitante", seccion: "Mapa", esperado: { "mi-ubicacion": 90, favoritos: 112.5, buscar: 135, "ofertas-cerca": 157.5, zoom: 180 } }, // RF-22: Mi ubicación en 90°
  { ruta: "/negocio", rol: "visitante", seccion: "Perfil de negocio", esperado: { atras: 90, favorito: 112.5, carta: 135, "como-llegar": 157.5, compartir: 180 } },
  { ruta: "/negocio", rol: "dueno", seccion: "Perfil de negocio", esperado: { atras: 90, "agregar-plato": 135, editar: 180 } },
  { ruta: "/negocio/carta", rol: "visitante", seccion: "Carta", esperado: { atras: 90, compartir: 135, favorito: 180 } },
  { ruta: "/producto/arepa-queso", rol: "dueno", seccion: "Detalle de producto", esperado: { atras: 90, "marcar-no-disponible": 120, editar: 150, eliminar: 180 } },
  { ruta: "/ajustes", rol: "visitante", seccion: "Ajustes", esperado: { atras: 90 } },
] as const;

for (const c of CASOS) {
  test(`${c.ruta} (${c.rol}): sección "${c.seccion}" y exactamente sus acciones, en su lugar`, async ({ page }) => {
    await prepararRol(page, c.rol);
    await sinBienvenida(page);
    await page.goto(c.ruta);
    await expect(page.getByRole("button", { name: `Menú, sección ${c.seccion}` })).toBeVisible();
    expect(await angulos(page)).toEqual(c.esperado);
  });
}

test("HU-10: 'Carta' desde el perfil cambia la sección y el ícono del centro; 'Compartir' no los cambia", async ({ page }) => {
  await prepararRol(page, "visitante");
  await sinBienvenida(page);
  await page.goto("/negocio");
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  const trazo = () => page.getByTestId("ancla").locator("path").first().getAttribute("d");
  const iconoPerfil = await trazo();

  // Mientras se preselecciona "Carta", el centro anticipa su ícono (D-09): se guarda para comparar.
  await gestos.presionar(g.centro);
  await gestos.mover(haciaOpcion(g, "carta", 50));
  await gestos.mover(haciaOpcion(g, "carta"));
  const iconoCarta = await trazo();
  expect(iconoCarta).not.toBe(iconoPerfil);
  await gestos.soltar(haciaOpcion(g, "carta"));

  await expect(page).toHaveURL(/\/negocio\/carta$/);
  const ancla = page.getByRole("button", { name: "Menú, sección Carta" });
  await expect(ancla).toBeVisible();
  expect(await trazo()).toBe(iconoCarta); // en reposo, el ícono de la sección Carta

  const g2 = await leerGeometria(page);
  await gestos.deslizar(g2.centro, haciaOpcion(g2, "compartir"), { pasos: 8, ms: 120 });
  await expect(page.getByText("Enlace de la carta copiado (simulado)")).toBeVisible();
  await expect(ancla).toBeVisible(); // la sección no cambió
  expect(await trazo()).toBe(iconoCarta);
});
