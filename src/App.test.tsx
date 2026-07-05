import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { fillPhq9 } from './test/fillPhq9'

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
    'Patient Health Questionnaire-9 (PHQ-9) · FHIR Form Engine',
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

  await user.click(screen.getByRole('link', { name: 'Kitchen Sink' }))

  const heading = await screen.findByRole('heading', {
    name: 'Kitchen Sink (renderer coverage form)',
  })
  await waitFor(() => expect(heading).toHaveFocus())
  expect(window.location.search).toBe('?form=kitchen-sink')
  expect(document.title).toBe(
    'Kitchen Sink (renderer coverage form) · FHIR Form Engine',
  )
  expect(screen.getByText('Total score: 0')).toBeInTheDocument()
})

test('a valid submit shows the completed view with focus on its heading', async () => {
  const user = userEvent.setup()
  render(<App />)
  await screen.findByRole('button', { name: 'Submit' })

  await fillPhq9(user, 'Several days')
  await user.click(screen.getByRole('button', { name: 'Submit' }))

  const heading = await screen.findByRole('heading', {
    name: 'Questionnaire completed',
  })
  await waitFor(() => expect(heading).toHaveFocus())
  expect(screen.getByText('Total score: 9')).toBeInTheDocument()
  expect(screen.getByText('Severity: Mild depression')).toBeInTheDocument()
  expect(
    screen.getByText(/not for clinical, diagnostic, or treatment use/),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Download QuestionnaireResponse' }),
  ).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Submit' })).toBeNull()
})

test('start over resets the store and returns focus to the form heading', async () => {
  const user = userEvent.setup()
  render(<App />)
  await screen.findByRole('button', { name: 'Submit' })

  await fillPhq9(user, 'Several days')
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  await screen.findByRole('heading', { name: 'Questionnaire completed' })

  await user.click(screen.getByRole('button', { name: 'Start over' }))

  const formHeading = await screen.findByRole('heading', {
    name: 'Patient Health Questionnaire-9 (PHQ-9)',
  })
  await waitFor(() => expect(formHeading).toHaveFocus())
  expect(screen.getByText('Total score: 0')).toBeInTheDocument()
  expect(screen.queryByRole('radio', { checked: true })).toBeNull()
})
