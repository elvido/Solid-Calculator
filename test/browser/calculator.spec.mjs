import { expect, test } from '@playwright/test';

test('calculator handles keyboard input and operator precedence', async ({ page }) => {
  await page.goto('/');

  const display = page.locator('[aria-live="polite"]');
  await expect(display).toHaveText('0');

  for (const key of ['2', '+', '3', '*', '4', 'Enter']) {
    await page.keyboard.press(key);
  }

  await expect(display).toHaveText('14');
});

test('calculator supports theme switching and visible errors', async ({ page }) => {
  await page.goto('/');

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

  await themeButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
