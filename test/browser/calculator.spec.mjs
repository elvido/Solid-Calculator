import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.request.post('/config', { data: { theme: 'light' } });
});

async function openCalculator(page) {
  await expect
    .poll(
      async () => {
        try {
          const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
          return Boolean(response?.ok()) && (await page.getByRole('heading', { name: 'Solid Calculator' }).isVisible());
        } catch {
          return false;
        }
      },
      { timeout: 60_000, intervals: [100, 500, 1_000] }
    )
    .toBe(true);
}

test('calculator handles keyboard input and operator precedence', async ({ page }) => {
  await openCalculator(page);

  const display = page.locator('[aria-live="polite"]');
  await expect(display).toHaveText('0');

  for (const key of ['2', '+', '3', '*', '4', 'Enter']) {
    await page.keyboard.press(key);
  }

  await expect(display).toHaveText('14');
});

test('calculator supports theme switching and visible errors', async ({ page }) => {
  await openCalculator(page);
  await expect.poll(() => page.locator('html').getAttribute('data-theme')).toMatch(/^(light|dark)$/);

  const themeButton = page.getByRole('button', { name: /Dark|Light/ });
  await expect(themeButton).toBeVisible();

  if ((await page.locator('html').getAttribute('data-theme')) === 'dark') {
    await themeButton.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  }

  await themeButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.keyboard.press('Escape');
  for (const key of ['8', '/', '0', 'Enter']) {
    await page.keyboard.press(key);
  }

  await expect(page.locator('[aria-live="polite"]')).toHaveText('Error');

  const configSaved = page.waitForResponse(
    (response) => response.url().includes('/config') && response.request().method() === 'POST'
  );
  await themeButton.click();
  await configSaved;
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
