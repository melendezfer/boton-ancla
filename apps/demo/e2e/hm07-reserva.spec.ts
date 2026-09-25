import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos } from "./helpers/gestos";

// HM-07: las hojas reservan el espacio del lado del ancla (MARGEN_LATERAL + D_ACTIVO = 88 px):
// su X queda visible y alcanzable, a cualquier altura del ancla.

const RESERVA = 24 + 64;

function preparar(page: Page, mano: "right" | "left", anclaAltura: number) {
  return page.addInitScript(
    ([m, a]) => {
      try {
        window.localStorage.clear();
        window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify({ mano: m, anclaAltura: a }));
      } catch {}
    },
    [mano, anclaAltura] as const,
  );
}

const seCruzan = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

for (const mano of ["right", "left"] as const) {
  for (const [hoja, altura] of [
    ["ofertas-cerca", 0.2],
    ["ofertas-cerca", 0.3],
    ["ofertas-cerca", 0.44],
    ["favoritos", 0.2],
    ["buscar", 0.2],
  ] as const) {
    test(`mano ${mano === "right" ? "derecha" : "izquierda"} · ${hoja} · ancla al ${Math.round(altura * 100)} %: la X queda libre y funciona`, async ({ page }) => {
      await preparar(page, mano, altura);
      await sinBienvenida(page);
      await page.goto("/mapa");
      await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
      const g = await leerGeometria(page);
      const gestos = await crearGestos(page);
      await gestos.deslizar(g.centro, haciaOpcion(g, hoja), { pasos: 8, ms: 150 });
      const dialogo = page.getByRole("dialog").filter({ has: page.getByRole("button", { name: "Cerrar" }) });
      await expect(dialogo).toBeVisible();
      if (hoja === "buscar") await page.getByTestId("campo-busqueda").blur();

      const x = dialogo.getByRole("button", { name: "Cerrar" });
      const cajaX = (await x.boundingBox())!;
      const ancho = page.viewportSize()!.width;
      // 1) La X queda entera fuera de la franja del ancla (lo que reserva la hoja).
      if (mano === "right") expect(cajaX.x + cajaX.width).toBeLessThanOrEqual(ancho - RESERVA);
      else expect(cajaX.x).toBeGreaterThanOrEqual(RESERVA);
      // 2) No se cruza con el ancla, y en su centro lo que hay es la X (alcanzable).
      expect(seCruzan(cajaX, (await page.getByTestId("ancla").boundingBox())!)).toBe(false);
      const encima = await page.evaluate(
        ([cx, cy]) => document.elementFromPoint(cx!, cy!)?.closest("button")?.getAttribute("aria-label"),
        [cajaX.x + cajaX.width / 2, cajaX.y + cajaX.height / 2],
      );
      expect(encima).toBe("Cerrar");
      await x.click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    });
  }
}
