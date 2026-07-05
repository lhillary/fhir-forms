import { expect, test } from '@playwright/test'

// Completes PHQ-9 with the keyboard only: Tab to move, arrows to select radios,
// Enter to submit. No pointer input on any form control.
test('phq9 can be completed keyboard-only and shows the score', async ({
  page,
}) => {
  await page.goto('/?form=phq9')
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()

  // Tab past the skip link and the two nav links into the first radio group
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')

  for (let question = 1; question <= 9; question += 1) {
    await page.keyboard.press('Tab')
    // Arrow from the (unselected) first radio selects "Several days" (weight 1)
    await page.keyboard.press('ArrowDown')
    await expect(
      page.locator(`#field-q${question}`).getByRole('radio', { checked: true }),
    ).toHaveCount(1)
  }

  await expect(page.getByRole('region', { name: 'Score' })).toContainText(
    'Total score: 9',
  )

  await page.keyboard.press('Tab') // difficulty drop-down (optional, skipped)
  await page.keyboard.press('Tab') // Submit
  await expect(page.getByRole('button', { name: 'Submit' })).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(
    page.getByRole('heading', { name: 'There is a problem' }),
  ).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Score' })).toContainText(
    'Total score: 9',
  )
})
