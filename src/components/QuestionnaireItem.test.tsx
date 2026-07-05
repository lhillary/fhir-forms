import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Questionnaire } from 'fhir/r4'
import type { ReactElement } from 'react'
import { beforeEach, expect, test } from 'vitest'
import kitchenSink from '../fixtures/kitchen-sink.json'
import { parseQuestionnaire } from '../parser/parseQuestionnaire'
import { useFormStore } from '../store/useFormStore'
import { QuestionnaireItem } from './QuestionnaireItem'

const items = parseQuestionnaire(kitchenSink as unknown as Questionnaire)

function Tree(): ReactElement {
  return (
    <>
      {items.map((item) => (
        <QuestionnaireItem key={item.linkId} item={item} />
      ))}
    </>
  )
}

beforeEach(() => {
  useFormStore.getState().hydrate(items)
})

test('a disabled item renders nothing', () => {
  render(<Tree />)
  expect(
    screen.queryByRole('textbox', { name: /Car make/ }),
  ).not.toBeInTheDocument()
})

test('toggling hasCar reveals and hides carMake', async () => {
  const user = userEvent.setup()
  render(<Tree />)

  await user.click(screen.getByRole('checkbox', { name: 'Do you own a car?' }))
  expect(
    await screen.findByRole('textbox', { name: /Car make/ }),
  ).toBeInTheDocument()

  await user.click(screen.getByRole('checkbox', { name: 'Do you own a car?' }))
  expect(
    screen.queryByRole('textbox', { name: /Car make/ }),
  ).not.toBeInTheDocument()
})

test('an unsupported item renders a graceful placeholder', () => {
  render(<Tree />)
  expect(screen.getByText(/Preferred appointment time/)).toBeInTheDocument()
  expect(
    screen.getByText(/Unsupported field type \(time\)/),
  ).toBeInTheDocument()
})

test('a hidden item renders nothing', () => {
  render(<Tree />)
  expect(
    screen.queryByText(/Internal reference \(should not render\)/),
  ).not.toBeInTheDocument()
})

test('groups render as fieldsets with the group text as legend', () => {
  render(<Tree />)
  expect(
    screen.getByRole('group', { name: 'Demographics' }),
  ).toBeInTheDocument()
})
