import { expect, test } from "@playwright/test";

test("home renders hero and workforce", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Eidon/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("isn't human");
  await expect(page.getByText("Twelve specialists")).toBeVisible();
});

test("navigation reaches integrations and pricing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Integrations" }).first().click();
  await expect(page).toHaveURL(/\/integrations/);
  await expect(page.getByText("50 native integrations").first()).toBeVisible();

  await page.getByRole("link", { name: "Pricing" }).first().click();
  await expect(page).toHaveURL(/\/pricing/);
  await expect(page.getByText("Start small.").first()).toBeVisible();
});

test("employees page lists 12 and opens a profile", async ({ page }) => {
  await page.goto("/employees");
  await expect(page.getByText("12 employees")).toBeVisible();
  await page.goto("/employees/ava-sales-development");
  await expect(page).toHaveURL(/\/employees\/ava-sales-development/);
  await expect(
    page.getByText("Sales Development Representative", { exact: true }).first(),
  ).toBeVisible();
});

test("chat sends a message and receives a reply", async ({ page }) => {
  await page.goto("/playground");
  const textarea = page.getByPlaceholder(/Ask/).or(page.locator("textarea")).first();
  await textarea.fill("Write a cold email sequence.");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Outbound sequence|Account plan|MEDDIC/).first()).toBeVisible({
    timeout: 30_000,
  });
});
