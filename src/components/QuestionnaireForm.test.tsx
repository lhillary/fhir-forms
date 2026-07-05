import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Questionnaire } from 'fhir/r4'
import { expect, test } from 'vitest'
import kitchenSink from '../fixtures/kitchen-sink.json'
import phq9 from '../fixtures/phq9.json'
import { parseQuestionnaire } from '../parser/parseQuestionnaire'
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
