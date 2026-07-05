import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function expectNoViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  expect(results.violations).toEqual([])
}

for (const form of ['phq9', 'kitchen-sink']) {
  test(`${form}: initial render has no axe violations`, async ({ page }) => {
    await page.goto(`/?form=${form}`)
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()
    await expectNoViolations(page)
  })

  test(`${form}: post-submit error state has no axe violations`, async ({
    page,
  }) => {
    await page.goto(`/?form=${form}`)
    await page.getByRole('button', { name: 'Submit' }).click()

    const heading = page.getByRole('heading', { name: 'There is a problem' })
    await expect(heading).toBeVisible()
    await expect(heading).toBeFocused()
    await expectNoViolations(page)
  })
}

test('kitchen-sink: enableWhen-expanded state has no axe violations', async ({
  page,
}) => {
  await page.goto('/?form=kitchen-sink')
  await page.getByText('Do you own a car?').click()
  await expect(page.getByRole('textbox', { name: /Car make/ })).toBeVisible()
  await expectNoViolations(page)
})

test('phq9: answered state has no axe violations', async ({ page }) => {
  await page.goto('/?form=phq9')
  const group = page.getByRole('radiogroup', {
    name: /Little interest or pleasure/,
  })
  await group.getByText('Several days').click()
  await expect(page.getByText('Total score: 1')).toBeVisible()
  await expectNoViolations(page)
})

test('reset confirmation dialog has no axe violations', async ({ page }) => {
  await page.goto('/?form=phq9')
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(
    page.getByRole('alertdialog', { name: 'Clear all answers?' }),
  ).toBeVisible()
  await expectNoViolations(page)
})
