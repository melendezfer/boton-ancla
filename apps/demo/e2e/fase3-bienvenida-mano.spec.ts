import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { crearGestos } from "./helpers/gestos";

// Fase 3, T3-09 (H13, RF3-14, DF3-08): la primera vez, la bienvenida pregunta la mano.

async function limpio(page: Page) {
  await page.addInitScript(() => {
    try {
      if (!window.sessionStorage.getItem("prueba-limpia")) {
        window.localStorage.clear();
        window.sessionStorage.setItem("prueba-limpia", "1");
      }
    } catch {}
  });
}

const raiz = (page: Page) => page.locator(".ba-raiz");

test("la primera vez pregunta; deslizar el asa a la izquierda deja el ancla a la izquierda y sigue la demostración", async ({ page }) => {
  await limpio(page);
  await page.goto("/mapa");
  await expect(page.getByTestId("asa-mano")).toBeVisible();
  await expect(page.getByText("¿Con qué mano? Desliza hacia ese lado")).toBeVisible();
  await expect(page.getByTestId("ancla")).toHaveCount(0);

  const asa = (await page.getByTestId("asa-mano").boundingBox())!;
  const c = { x: asa.x + asa.width / 2, y: asa.y + asa.height / 2 };
  const gestos = await crearGestos(page);
  await gestos.deslizar(c, { x: c.x - 120, y: c.y }, { pasos: 8, ms: 150 });

  await expect(page.getByTestId("pregunta-mano")).toHaveCount(0);
  await expect(raiz(page)).toHaveAttribute("data-mano", "left");
  await expect(page.getByTestId("demostracion")).toBeAttached(); // después, la demostración de siempre
  // La segunda vez no se pregunta.
  await page.reload();
  await expect(page.getByTestId("ancla")).toBeVisible();
  await expect(page.getByTestId("pregunta-mano")).toHaveCount(0);
});

test("un deslizamiento corto no decide: el asa vuelve al centro", async ({ page }) => {
  await limpio(page);
  await page.goto("/mapa");
  const asa = (await page.getByTestId("asa-mano").boundingBox())!;
  const c = { x: asa.x + asa.width / 2, y: asa.y + asa.height / 2 };
  const gestos = await crearGestos(page);
  await gestos.deslizar(c, { x: c.x + 15, y: c.y }, { pasos: 4, ms: 80 });
  await expect(page.getByTestId("asa-mano")).toBeVisible();
});

test("los botones también sirven (para quien prefiere tocar)", async ({ page }) => {
  await limpio(page);
  await page.goto("/mapa");
  await page.getByTestId("mano-derecha").click();
  await expect(page.getByTestId("pregunta-mano")).toHaveCount(0);
  await expect(raiz(page)).toHaveAttribute("data-mano", "right");
});

test("quien ya hizo la bienvenida no ve la pregunta; 'Repetir la bienvenida' la vuelve a mostrar", async ({ page }) => {
  await sinBienvenida(page);
  await page.goto("/mapa");
  await expect(page.getByTestId("ancla")).toBeVisible();
  await expect(page.getByTestId("pregunta-mano")).toHaveCount(0);
  await page.goto("/ajustes");
  await expect(page.getByTestId("ancla")).toBeVisible();
  await page.getByRole("button", { name: "Repetir la bienvenida" }).click();
  await expect(page.getByTestId("asa-mano")).toBeVisible();
});
