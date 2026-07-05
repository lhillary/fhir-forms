import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { beforeEach, expect, test } from 'vitest'
import type { NormalizedAnswerOption } from '../../parser/types'
import { useFormStore } from '../../store/useFormStore'
import { makeItem } from '../../test/makeItem'
import { SingleChoiceField } from './SingleChoiceField'

const options: NormalizedAnswerOption[] = [
  { code: 'http://x|a', display: 'Alpha', valueType: 'coding' },
  { code: 'http://x|b', display: 'Beta', valueType: 'coding' },
]

const radioItem = makeItem({
  linkId: 'pick',
  type: 'choice',
  text: 'Pick one',
  required: true,
  options,
})

beforeEach(() => {
  useFormStore.getState().hydrate([radioItem])
})

test('renders options as a radio group named by the question text', () => {
  render(<SingleChoiceField item={radioItem} />)
  expect(
    screen.getByRole('radiogroup', { name: /Pick one/ }),
  ).toBeInTheDocument()
  expect(screen.getAllByRole('radio')).toHaveLength(2)
})

test('clicking an option stores the full coding', async () => {
  const user = userEvent.setup()
  render(<SingleChoiceField item={radioItem} />)

  await user.click(screen.getByText('Beta'))

  expect(useFormStore.getState().answers['pick']).toEqual({
    type: 'coding',
    system: 'http://x',
    code: 'b',
    display: 'Beta',
  })
})

test('radios are selectable with space and arrow keys', async () => {
  const user = userEvent.setup()
  render(<SingleChoiceField item={radioItem} />)

  await user.tab()
  await user.keyboard(' ')
  expect(useFormStore.getState().answers['pick']).toMatchObject({ code: 'a' })

  await user.keyboard('{ArrowDown}')
  expect(useFormStore.getState().answers['pick']).toMatchObject({ code: 'b' })
})

test('shows a required error after a submit attempt', () => {
  render(<SingleChoiceField item={radioItem} />)
  act(() => {
    useFormStore.getState().attemptSubmit()
  })
  expect(screen.getByText('An answer is required')).toBeInTheDocument()
})

test('drop-down control renders a select and stores the picked option', async () => {
  const dropdown = makeItem({
    linkId: 'pick',
    type: 'choice',
    text: 'Pick one',
    control: 'drop-down',
    options,
  })
  useFormStore.getState().hydrate([dropdown])
  const user = userEvent.setup()
  render(<SingleChoiceField item={dropdown} />)

  await user.click(screen.getByRole('button', { name: /Pick one/ }))
  await user.click(await screen.findByRole('option', { name: 'Beta' }))

  expect(useFormStore.getState().answers['pick']).toMatchObject({ code: 'b' })
  expect(screen.getByRole('button', { name: /Beta/ })).toBeInTheDocument()
})

test('autocomplete control filters by typing and selects with the keyboard', async () => {
  const combo = makeItem({
    linkId: 'pick',
    type: 'choice',
    text: 'Pick one',
    control: 'autocomplete',
    options,
  })
  useFormStore.getState().hydrate([combo])
  const user = userEvent.setup()
  render(<SingleChoiceField item={combo} />)

  const input = screen.getByRole('combobox', { name: /Pick one/ })
  await user.type(input, 'Bet')
  const filtered = await screen.findAllByRole('option')
  expect(filtered).toHaveLength(1)

  await user.keyboard('{ArrowDown}{Enter}')
  expect(useFormStore.getState().answers['pick']).toMatchObject({ code: 'b' })
})
