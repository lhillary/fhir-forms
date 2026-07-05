import { test, expect } from '@playwright/test'

test('app boots and renders the heading', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { level: 1, name: 'fhir-forms' }),
  ).toBeVisible()
})
