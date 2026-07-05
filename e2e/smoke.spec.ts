import { test, expect } from '@playwright/test'

test('app boots and renders the heading', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { level: 1, name: 'fhir-forms' }),
  ).toBeVisible()
  await expect(page).toHaveTitle(
    'Patient Health Questionnaire-9 (PHQ-9) · fhir-forms',
  )
})

test('the skip link is first in tab order and moves focus to the form region', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()

  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: 'Skip to form' })
  await expect(skipLink).toBeFocused()

  await page.keyboard.press('Enter')
  await expect(page.locator('#form-region')).toBeFocused()
})

test('the form picker switches forms, updates the URL and title, and focuses the heading', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()

  await page.getByRole('link', { name: 'Kitchen sink' }).click()

  const heading = page.getByRole('heading', {
    name: 'Kitchen Sink (renderer coverage form)',
  })
  await expect(heading).toBeVisible()
  await expect(heading).toBeFocused()
  await expect(page).toHaveURL(/\?form=kitchen-sink/)
  await expect(page).toHaveTitle(
    'Kitchen Sink (renderer coverage form) · fhir-forms',
  )
})

test('reset clears answers after confirmation', async ({ page }) => {
  await page.goto('/?form=phq9')
  const group = page.getByRole('radiogroup', {
    name: /Little interest or pleasure/,
  })
  await group.getByText('Several days').click()
  await expect(page.getByText('Total score: 1')).toBeVisible()

  await page.getByRole('button', { name: 'Reset' }).click()
  await page
    .getByRole('alertdialog', { name: 'Clear all answers?' })
    .getByRole('button', { name: 'Clear answers' })
    .click()

  await expect(page.getByText('Total score: 0')).toBeVisible()
  await expect(group.getByRole('radio', { checked: true })).toHaveCount(0)
})
