import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test } from 'vitest'
import App from './App'

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

test('renders PHQ-9 by default with a descriptive document title', async () => {
  render(<App />)

  expect(
    await screen.findByRole('heading', {
      name: 'Patient Health Questionnaire-9 (PHQ-9)',
    }),
  ).toBeVisible()
  expect(document.title).toBe(
    'Patient Health Questionnaire-9 (PHQ-9) · fhir-forms',
  )
})

test('the skip link is the first focusable element and targets the form region', async () => {
  const user = userEvent.setup()
  render(<App />)
  await screen.findByRole('button', { name: 'Submit' })

  await user.tab()
  const skipLink = screen.getByRole('link', { name: 'Skip to form' })
  expect(skipLink).toHaveFocus()
  expect(skipLink).toHaveAttribute('href', '#form-region')
})

test('switching forms updates the URL, resets answers, and focuses the new heading', async () => {
  const user = userEvent.setup()
  render(<App />)
  await screen.findByRole('button', { name: 'Submit' })

  await user.click(screen.getByRole('link', { name: 'Kitchen sink' }))

  const heading = await screen.findByRole('heading', {
    name: 'Kitchen Sink (renderer coverage form)',
  })
  await waitFor(() => expect(heading).toHaveFocus())
  expect(window.location.search).toBe('?form=kitchen-sink')
  expect(document.title).toBe(
    'Kitchen Sink (renderer coverage form) · fhir-forms',
  )
  expect(screen.getByText('Total score: 0')).toBeInTheDocument()
})
