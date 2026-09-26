import { expect, test } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla } from "./helpers/ancla";

// T-21: accesibilidad (RNF-04, RNF-05, C-12).
// Mapa, orden de las opciones de arriba al extremo lateral: Favoritos 90° · Mi ubicación 120° · Buscar 150° (prioridad 1) · Ofertas cerca 180°.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {}
  });
  await sinBienvenida(page);
});

test("RNF-05: Enter abre con el foco en la prioridad 1, las flechas lo mueven y Enter ejecuta", async ({ page }) => {
  await page.goto("/mapa");
  const ancla = page.getByRole("button", { name: "Menú, sección Mapa" });
  await ancla.focus();
  await page.keyboard.press("Enter");
  await expect(ancla).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("menu", { name: "Opciones de Mapa" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Buscar" })).toBeFocused();
  await expect(page.getByTestId("banda")).toHaveText("Buscar");

  // 5 posiciones (RF-22, HM-12a): Mi ubicación 90°, Favoritos 112,5°, Buscar 135°, Ofertas 157,5°, Zoom 180°.
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("menuitem", { name: "Favoritos" })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.getByRole("menuitem", { name: "Mi ubicación" })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("menuitem", { name: "Zoom" })).toBeFocused();
  await page.keyboard.press("ArrowRight"); // mano derecha: → va hacia arriba
  await expect(page.getByRole("menuitem", { name: "Ofertas cerca" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("menuitem", { name: "Buscar" })).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Buscar" })).toBeVisible();
  expect(await estadoAncla(page)).toBe("reposo");
});

test("RNF-05: Escape cierra y devuelve el foco al ancla", async ({ page }) => {
  await page.goto("/mapa");
  const ancla = page.getByRole("button", { name: "Menú, sección Mapa" });
  await ancla.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(ancla).toBeFocused();
  await expect(ancla).toHaveAttribute("aria-expanded", "false");
});

test("C-12: con teclado el menú no se cierra por tiempo", async ({ page }) => {
  await page.goto("/mapa");
  await page.getByTestId("ancla").focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(4500); // más que T_INACTIVO
  expect(await estadoAncla(page)).toBe("abierto_teclado");
  await page.keyboard.press("Escape");
});

test("RNF-05: una irreversible con teclado pide confirmar; Enter sobre 'Confirmar' la ejecuta", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify({ rol: "dueno" })));
  await page.goto("/producto/arepa-queso");
  await page.getByTestId("ancla").focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("End"); // Eliminar, en el extremo lateral
  await expect(page.getByRole("menuitem", { name: "Eliminar" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("confirmar")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/negocio\/carta$/);
});

test("C-12: un click sin toque previo (lector de pantalla) abre en modo toque sin cierre por tiempo", async ({ page }) => {
  await page.goto("/mapa");
  await page.getByTestId("ancla").evaluate((el) => (el as HTMLElement).click());
  await expect.poll(() => estadoAncla(page)).toBe("abierto_toque");
  await page.waitForTimeout(4500);
  expect(await estadoAncla(page)).toBe("abierto_toque");
});

test("RNF-04: con movimiento reducido las opciones solo cambian de opacidad", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/mapa");
  await page.getByTestId("ancla").focus();
  await page.keyboard.press("Enter");
  const animacion = await page.getByTestId("opcion-buscar").evaluate((el) => getComputedStyle(el).animationName);
  expect(animacion).toBe("ba-aparecer");
  const transicion = await page.getByTestId("ancla").evaluate((el) => getComputedStyle(el).transitionProperty);
  expect(transicion).not.toContain("transform");
});

test("RNF-04: sin preferencia, las opciones salen del centro (transform)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/mapa");
  await page.getByTestId("ancla").focus();
  await page.keyboard.press("Enter");
  expect(await page.getByTestId("opcion-buscar").evaluate((el) => getComputedStyle(el).animationName)).toBe("ba-salir");
});
