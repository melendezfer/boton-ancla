import { expect, test } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";

// T-15: ancla en reposo (D-04, D-09, D-17, RF-12, RF-14, RNF-05, C-02).

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {}
  });
  await sinBienvenida(page);
});

test("es un botón de menú con nombre accesible 'Menú, sección {sección}' (RNF-05)", async ({ page }) => {
  await page.goto("/mapa");
  const ancla = page.getByRole("button", { name: "Menú, sección Mapa" });
  await expect(ancla).toBeVisible();
  await expect(ancla).toHaveAttribute("aria-haspopup", "menu");
  await expect(ancla).toHaveAttribute("aria-expanded", "false");
});

test("el nombre cambia con la sección (D-09, RF-10)", async ({ page }) => {
  await page.goto("/negocio");
  await expect(page.getByRole("button", { name: "Menú, sección Perfil de negocio" })).toBeVisible();
  await page.goto("/negocio/carta");
  await expect(page.getByRole("button", { name: "Menú, sección Carta" })).toBeVisible();
});

test("queda entero dentro del viewport, del lado derecho, a 24 px del borde (RF-12, L-02)", async ({ page }) => {
  await page.goto("/mapa");
  const caja = (await page.getByTestId("ancla").boundingBox())!;
  const vp = page.viewportSize()!;
  expect(caja.x).toBeGreaterThan(vp.width / 2);
  expect(caja.x + caja.width).toBeLessThanOrEqual(vp.width - 24);
  expect(caja.y).toBeGreaterThan(0);
  expect(caja.y + caja.height).toBeLessThanOrEqual(vp.height - 16);
  expect(caja.width).toBeCloseTo(52, 0); // D_REPOSO
});

test("reposo translúcido con desenfoque e ícono oscuro (D-04, C-02)", async ({ page }) => {
  await page.goto("/mapa");
  const estilo = await page.getByTestId("ancla").evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fondo: cs.backgroundColor, blur: cs.backdropFilter || cs.getPropertyValue("-webkit-backdrop-filter"), color: cs.color };
  });
  expect(estilo.blur).toContain("blur");
  expect(estilo.fondo).not.toMatch(/^rgb\(255, 255, 255\)$/); // no es blanco opaco
  expect(estilo.color).toBe("rgb(27, 27, 27)"); // --color-text de RUTEANDO
});

test("toques largos no abren el menú contextual del navegador (RNF-02)", async ({ page }) => {
  await page.goto("/mapa");
  const prevenido = await page.getByTestId("ancla").evaluate((el) => {
    const e = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    el.dispatchEvent(e);
    return e.defaultPrevented;
  });
  expect(prevenido).toBe(true);
  const ta = await page.getByTestId("ancla").evaluate((el) => getComputedStyle(el).touchAction);
  expect(ta).toBe("none");
});
