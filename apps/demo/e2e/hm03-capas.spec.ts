import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos } from "./helpers/gestos";

// HM-03: capas y "Cerrar" (spec RF-15, HU-14, D-10).

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      if (!window.sessionStorage.getItem("prueba-limpia")) {
        window.localStorage.clear();
        window.sessionStorage.setItem("prueba-limpia", "1");
      }
    } catch {}
  });
  await sinBienvenida(page);
});

/** Llega al mapa DESDE otra página: si "atrás" navegara, se notaría (volvería a /diagnostico). */
async function mapaConFavoritosAbierto(page: Page) {
  await page.goto("/diagnostico");
  await expect(page.getByText("React cargó en este dispositivo")).toBeVisible();
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "favoritos"), { pasos: 8, ms: 150 });
  await expect(page.getByRole("dialog", { name: "Favoritos" })).toBeVisible();
  return { antes: g, gestos };
}

test("HM-08: con una capa abierta, 'Cerrar' va a 90°, el fondo se oculta y el centro muestra la capa", async ({ page }) => {
  const { antes } = await mapaConFavoritosAbierto(page);
  const ahora = await leerGeometria(page);
  expect(ahora.slots.find((s) => s.id === "cerrar")?.angulo).toBeCloseTo(90, 5);
  for (const id of ["buscar", "mi-ubicacion", "ofertas-cerca", "favoritos"]) expect(ahora.slots.find((s) => s.id === id)).toBeUndefined();
  await expect(page.getByRole("button", { name: "Menú, Favoritos" })).toBeVisible(); // D-09 (HM-08 2-A)

  // Al cerrar, el fondo vuelve con sus mismas posiciones.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const despues = await leerGeometria(page);
  for (const s of antes.slots) expect(despues.slots.find((x) => x.id === s.id)?.angulo).toBeCloseTo(s.angulo, 5);
  await expect(page.getByRole("button", { name: "Menú, sección Mapa" })).toBeVisible();
});

test("HM-08 1-A: con una capa abierta, 'Deshacer' entra al abanico de la capa", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify({ rol: "dueno" })));
  await page.goto("/producto/arepa-queso");
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "marcar-no-disponible"), { pasos: 8, ms: 150 });
  await expect(page.getByTestId("aviso")).toBeVisible();

  // Mientras dura el aviso, se abre una capa en la misma página (botón del contenido).
  await page.getByRole("button", { name: "Editar producto" }).click();
  await expect(page.getByRole("dialog", { name: "Editar producto (simulado)" })).toBeVisible();

  const enCapa = await leerGeometria(page);
  expect(Object.fromEntries(enCapa.slots.map((s) => [s.id, Math.round(s.angulo)]))).toEqual({ cerrar: 90, deshacer: 180 });
  await gestos.deslizar(enCapa.centro, haciaOpcion(enCapa, "deshacer"), { pasos: 8, ms: 150 });
  await expect(page.getByTestId("aviso")).toHaveCount(0);
  await expect(page.getByText("Disponible", { exact: true })).toBeVisible(); // se deshizo
});

test("HU-14: deslizar a 'Cerrar' cierra la capa, solo deslizando", async ({ page }) => {
  const { gestos } = await mapaConFavoritosAbierto(page);
  const g = await leerGeometria(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "cerrar"), { pasos: 8, ms: 150 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/mapa$/);
  // Sin capas, vuelve Favoritos a 90°.
  expect((await leerGeometria(page)).slots.find((s) => s.id === "favoritos")?.angulo).toBeCloseTo(90, 5);
});

test("RF-15: el botón atrás del sistema cierra la capa SIN navegar", async ({ page }) => {
  await mapaConFavoritosAbierto(page);
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/mapa$/); // no volvió a /diagnostico
  await expect(page.getByRole("button", { name: "Menú, sección Mapa" })).toBeVisible();
  // Sin capas, el siguiente "atrás" sí navega.
  await page.goBack();
  await expect(page).toHaveURL(/\/diagnostico$/);
});

test("RF-15: si la capa se cierra con su X, el historial queda limpio (el atrás siguiente navega)", async ({ page }) => {
  await mapaConFavoritosAbierto(page);
  await page.getByRole("dialog", { name: "Favoritos" }).getByRole("button", { name: "Cerrar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.waitForTimeout(300); // el historial se sincroniza en un paso diferido
  await expect(page).toHaveURL(/\/mapa$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/diagnostico$/);
});

test("HM-03 D: Escape cierra la capa con el menú cerrado", async ({ page }) => {
  await mapaConFavoritosAbierto(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/mapa$/);
});

test("con 'Atrás' (perfil del dueño): 'Cerrar' lo reemplaza y cierra la hoja sin salir del perfil", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify({ rol: "dueno" })));
  await page.goto("/mapa");
  await expect(page.getByTestId("ancla")).toBeVisible();
  await page.goto("/negocio");
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "agregar-plato"), { pasos: 8, ms: 150 });
  await expect(page.getByRole("dialog", { name: "Agregar plato (simulado)" })).toBeVisible();
  const conCapa = await leerGeometria(page);
  expect(conCapa.slots.find((s) => s.id === "cerrar")?.angulo).toBeCloseTo(90, 5);
  expect(conCapa.slots.find((s) => s.id === "atras")).toBeUndefined();
  await gestos.deslizar(conCapa.centro, haciaOpcion(conCapa, "cerrar"), { pasos: 8, ms: 150 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/negocio$/);
});

test("HM-03 E: el atrás del sistema queda registrado en las métricas (layer_close)", async ({ page }) => {
  await mapaConFavoritosAbierto(page);
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const tipos = await page.evaluate(() =>
    (JSON.parse(window.localStorage.getItem("boton-ancla-demo:v1:metricas") ?? "[]") as { evento: { type: string; via?: string } }[]).map(
      (r) => `${r.evento.type}${r.evento.via ? `:${r.evento.via}` : ""}`,
    ),
  );
  expect(tipos).toContain("layer_close:sistema");
});
