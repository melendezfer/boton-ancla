import { expect, test, type Page } from "@playwright/test";
import { estadoAncla, haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos, type Gestos, type Punto } from "./helpers/gestos";

// T-19: acciones sensibles sin retraso (D-14, RF-07, RF-08, HU-07, HU-08, C-19, C-21).
// Producto (dueño): Atrás 90° · Marcar no disponible 120° · Editar 150° (prioridad 1) · Eliminar 180°.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
      window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify({ rol: "dueno" }));
    } catch {}
  });
});

async function abrirProducto(page: Page, id = "arepa-queso") {
  await page.goto(`/producto/${id}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  return leerGeometria(page);
}

async function tocar(gestos: Gestos, p: Punto) {
  await gestos.presionar(p);
  await gestos.soltar(p);
}

test("HU-07: 'Marcar no disponible' se aplica al instante y muestra el aviso con Deshacer", async ({ page }) => {
  const g = await abrirProducto(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "marcar-no-disponible"), { pasos: 8, ms: 150 });
  await expect(page.getByText("No disponible", { exact: true })).toBeVisible();
  await expect(page.getByTestId("aviso")).toHaveText("Marcado no disponible · Deshacer");
});

test("HU-07 + C-21: mientras dura el aviso, 'Deshacer' toma el lugar de la prioridad 1 y deshace solo deslizando", async ({ page }) => {
  const g = await abrirProducto(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "marcar-no-disponible"), { pasos: 8, ms: 150 });
  await expect(page.getByTestId("aviso")).toBeVisible();

  const conAviso = await leerGeometria(page);
  const editarAntes = g.slots.find((s) => s.id === "editar")!;
  const deshacer = conAviso.slots.find((s) => s.id === "deshacer")!;
  expect(deshacer).toBeDefined();
  expect(conAviso.slots.find((s) => s.id === "editar")).toBeUndefined(); // Editar queda oculta
  expect(deshacer.angulo).toBeCloseTo(editarAntes.angulo, 5); // misma posición
  for (const id of ["atras", "marcar-no-disponible", "eliminar"]) {
    expect(conAviso.slots.find((s) => s.id === id)!.angulo).toBeCloseTo(g.slots.find((s) => s.id === id)!.angulo, 5); // nada más se mueve
  }

  await gestos.deslizar(conAviso.centro, haciaOpcion(conAviso, "deshacer"), { pasos: 8, ms: 150 });
  await expect(page.getByText("Disponible", { exact: true })).toBeVisible();
  await expect(page.getByTestId("aviso")).toHaveCount(0);
  expect((await leerGeometria(page)).slots.map((s) => s.id)).toContain("editar"); // vuelve Editar
});

test("RF-08: tocar el aviso también deshace", async ({ page }) => {
  const g = await abrirProducto(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "marcar-no-disponible"), { pasos: 8, ms: 150 });
  await page.getByTestId("aviso").click();
  await expect(page.getByText("Disponible", { exact: true })).toBeVisible();
  await expect(page.getByTestId("aviso")).toHaveCount(0);
});

test("RF-08: el aviso de deshacer dura 5 s", async ({ page }) => {
  const g = await abrirProducto(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "marcar-no-disponible"), { pasos: 8, ms: 150 });
  await expect(page.getByTestId("aviso")).toBeVisible();
  await page.waitForTimeout(4000);
  await expect(page.getByTestId("aviso")).toBeVisible();
  await expect(page.getByTestId("aviso")).toHaveCount(0, { timeout: 2500 });
  await expect(page.getByText("No disponible", { exact: true })).toBeVisible(); // no se deshizo solo
});

test("HU-08: soltar sobre 'Eliminar' sin pasar el anillo NO elimina y pide deslizar más allá", async ({ page }) => {
  const g = await abrirProducto(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "eliminar"), { pasos: 8, ms: 150 });
  await expect(page.getByTestId("aviso")).toHaveText("Desliza más allá para confirmar");
  await expect(page).toHaveURL(/\/producto\/arepa-queso$/);
  await expect(page.getByRole("heading", { name: "Arepa de queso" })).toBeVisible();
});

test("HU-08: deslizar más allá del anillo exterior y soltar SÍ elimina", async ({ page }) => {
  const g = await abrirProducto(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover(haciaOpcion(g, "eliminar", 50));
  await gestos.mover(haciaOpcion(g, "eliminar"));
  await gestos.mover(haciaOpcion(g, "eliminar", g.rExterior + 12));
  await expect(page.getByTestId("banda")).toHaveText("Eliminar · suelta para confirmar");
  await gestos.soltar(haciaOpcion(g, "eliminar", g.rExterior + 12));
  await expect(page).toHaveURL(/\/negocio\/carta$/);
  await expect(page.getByText("Arepa de queso")).toHaveCount(0);
});

test("modo toque: una irreversible pide 'Confirmar' y solo así elimina", async ({ page }) => {
  const g = await abrirProducto(page);
  const gestos = await crearGestos(page);
  await tocar(gestos, g.centro);
  await expect.poll(() => estadoAncla(page)).toBe("abierto_toque");
  await tocar(gestos, haciaOpcion(g, "eliminar"));
  await expect.poll(() => estadoAncla(page)).toBe("confirmacion_toque");
  await expect(page.getByTestId("confirmar")).toHaveText("Confirmar: Eliminar");
  await page.getByTestId("confirmar").click();
  await expect(page).toHaveURL(/\/negocio\/carta$/);
});

test("C-09: con el producto no disponible, 'Marcar no disponible' está deshabilitada y soltar sobre ella no hace nada", async ({ page }) => {
  const g = await abrirProducto(page, "empanada");
  expect(g.slots.find((s) => s.id === "marcar-no-disponible")!.disabled).toBe(true);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover(haciaOpcion(g, "marcar-no-disponible", 50));
  await gestos.mover(haciaOpcion(g, "marcar-no-disponible"));
  await expect(page.getByTestId("banda")).toHaveText("Marcar no disponible · no disponible");
  await gestos.soltar(haciaOpcion(g, "marcar-no-disponible"));
  await expect(page.getByTestId("aviso")).toHaveCount(0);
});
