import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Questionnaire, QuestionnaireResponse } from 'fhir/r4'
import { expect, test, vi } from 'vitest'
import kitchenSink from '../fixtures/kitchen-sink.json'
import phq9 from '../fixtures/phq9.json'
import { parseQuestionnaire } from '../parser/parseQuestionnaire'
import { fillPhq9 } from '../test/fillPhq9'
import { QuestionnaireForm } from './QuestionnaireForm'

const phq9Questionnaire = phq9 as unknown as Questionnaire
const phq9Items = parseQuestionnaire(phq9Questionnaire)
const sinkQuestionnaire = kitchenSink as unknown as Questionnaire
const sinkItems = parseQuestionnaire(sinkQuestionnaire)

test('an empty required submit populates the error summary and moves focus to it', async () => {
  const user = userEvent.setup()
  render(
    <QuestionnaireForm items={phq9Items} questionnaire={phq9Questionnaire} />,
  )

  await user.click(await screen.findByRole('button', { name: 'Submit' }))

  const heading = await screen.findByRole('heading', {
    name: 'There is a problem',
  })
  await waitFor(() => expect(heading).toHaveFocus())
  // one link per errored field: q1-q9 are required
  expect(screen.getAllByRole('link')).toHaveLength(9)
})

test('an error summary link moves focus into the errored field', async () => {
  const user = userEvent.setup()
  render(
    <QuestionnaireForm items={phq9Items} questionnaire={phq9Questionnaire} />,
  )

  await user.click(await screen.findByRole('button', { name: 'Submit' }))
  await screen.findByRole('heading', { name: 'There is a problem' })

  const [firstLink] = screen.getAllByRole('link')
  expect(firstLink).toBeDefined()
  await user.click(firstLink as HTMLElement)

  const container = document.getElementById('field-q1')
  expect(container).not.toBeNull()
  expect(container).toContainElement(document.activeElement as HTMLElement)
})

test('enableWhen changes are announced through the polite live region', async () => {
  const user = userEvent.setup()
  render(
    <QuestionnaireForm items={sinkItems} questionnaire={sinkQuestionnaire} />,
  )
  await screen.findByRole('button', { name: 'Submit' })

  await user.click(screen.getByRole('checkbox', { name: 'Do you own a car?' }))
  expect(await screen.findByText('1 question added')).toBeInTheDocument()

  await user.click(screen.getByRole('checkbox', { name: 'Do you own a car?' }))
  expect(await screen.findByText('1 question removed')).toBeInTheDocument()
})

test('the score panel shows the live total', async () => {
  const user = userEvent.setup()
  render(
    <QuestionnaireForm items={phq9Items} questionnaire={phq9Questionnaire} />,
  )
  await screen.findByRole('button', { name: 'Submit' })

  expect(screen.getByText('Total score: 0')).toBeInTheDocument()
  const q1 = screen.getByRole('radiogroup', {
    name: /Little interest or pleasure/,
  })
  await user.click(within(q1).getByText('Nearly every day'))
  expect(screen.getByText('Total score: 3')).toBeInTheDocument()
})

test('the score panel shows the severity band from the bands lookup', async () => {
  const user = userEvent.setup()
  render(
    <QuestionnaireForm
      items={phq9Items}
      questionnaire={phq9Questionnaire}
      bands={[
        { min: 0, max: 4, label: 'Minimal depression' },
        { min: 5, max: 9, label: 'Mild depression' },
      ]}
    />,
  )
  await screen.findByRole('button', { name: 'Submit' })

  expect(screen.getByText('Severity: Minimal depression')).toBeInTheDocument()
  for (const question of ['Little interest or pleasure', 'Feeling down']) {
    const group = screen.getByRole('radiogroup', {
      name: new RegExp(question),
    })
    await user.click(within(group).getByText('Nearly every day'))
  }
  expect(screen.getByText('Total score: 6')).toBeInTheDocument()
  expect(screen.getByText('Severity: Mild depression')).toBeInTheDocument()
})

test('the score panel shows a persistent not-for-clinical-use disclaimer', async () => {
  render(
    <QuestionnaireForm items={phq9Items} questionnaire={phq9Questionnaire} />,
  )
  await screen.findByRole('button', { name: 'Submit' })

  expect(
    screen.getByText(/not for clinical, diagnostic, or treatment use/),
  ).toBeInTheDocument()
})

test('reset asks for confirmation before clearing answers', async () => {
  const user = userEvent.setup()
  render(
    <QuestionnaireForm items={phq9Items} questionnaire={phq9Questionnaire} />,
  )
  await screen.findByRole('button', { name: 'Submit' })

  const q1 = screen.getByRole('radiogroup', {
    name: /Little interest or pleasure/,
  })
  await user.click(within(q1).getByText('Nearly every day'))
  expect(screen.getByText('Total score: 3')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Reset' }))
  const dialog = await screen.findByRole('alertdialog', {
    name: 'Clear all answers?',
  })
  await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
  expect(screen.getByText('Total score: 3')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Reset' }))
  const reopened = await screen.findByRole('alertdialog', {
    name: 'Clear all answers?',
  })
  await user.click(
    within(reopened).getByRole('button', { name: 'Clear answers' }),
  )
  expect(screen.getByText('Total score: 0')).toBeInTheDocument()
  expect(within(q1).queryByRole('radio', { checked: true })).toBeNull()
})

test('a valid submit calls onSubmit with the finalized QuestionnaireResponse', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn<(qr: QuestionnaireResponse) => void>()
  render(
    <QuestionnaireForm
      items={phq9Items}
      questionnaire={phq9Questionnaire}
      onSubmit={onSubmit}
    />,
  )
  await screen.findByRole('button', { name: 'Submit' })

  await fillPhq9(user, 'Several days')
  await user.click(screen.getByRole('button', { name: 'Submit' }))

  expect(onSubmit).toHaveBeenCalledTimes(1)
  const qr = onSubmit.mock.calls[0]?.[0]
  expect(qr?.resourceType).toBe('QuestionnaireResponse')
  expect(qr?.status).toBe('completed')
  // q1-q9 answered "Several days" (LA6569-3); unanswered "difficulty" and the
  // display intro are excluded
  expect(
    qr?.item?.map(({ linkId, answer }) => [
      linkId,
      answer?.[0]?.valueCoding?.code,
    ]),
  ).toEqual(
    ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'].map((linkId) => [
      linkId,
      'LA6569-3',
    ]),
  )
  expect(screen.queryByRole('heading', { name: 'There is a problem' })).toBeNull()
})

test('an invalid submit does not call onSubmit and shows the error summary', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn<(qr: QuestionnaireResponse) => void>()
  render(
    <QuestionnaireForm
      items={phq9Items}
      questionnaire={phq9Questionnaire}
      onSubmit={onSubmit}
    />,
  )

  await user.click(await screen.findByRole('button', { name: 'Submit' }))

  expect(
    await screen.findByRole('heading', { name: 'There is a problem' }),
  ).toBeVisible()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('a questionnaire with no items renders the empty state, not a form', async () => {
  render(<QuestionnaireForm items={[]} questionnaire={phq9Questionnaire} />)

  expect(
    await screen.findByText('This questionnaire has no questions to display.'),
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Submit' })).toBeNull()
})
