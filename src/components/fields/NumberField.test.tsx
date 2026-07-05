import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import { useFormStore } from '../../store/useFormStore'
import { makeItem } from '../../test/makeItem'
import { NumberField } from './NumberField'

const age = makeItem({
  linkId: 'age',
  type: 'integer',
  text: 'Age (years)',
  constraints: { minValue: 0, maxValue: 120 },
})

beforeEach(() => {
  useFormStore.getState().hydrate([age])
})

test('renders a labelled number input', () => {
  render(<NumberField item={age} />)
  expect(
    screen.getByRole('textbox', { name: /Age \(years\)/ }),
  ).toBeInTheDocument()
})

test('writes the committed number to the store', async () => {
  const user = userEvent.setup()
  render(<NumberField item={age} />)

  await user.type(screen.getByRole('textbox', { name: /Age \(years\)/ }), '42')
  await user.tab()

  expect(useFormStore.getState().answers['age']).toEqual({
    type: 'integer',
    value: 42,
  })
})

test('shows a range error only after the field is touched', async () => {
  const user = userEvent.setup()
  render(<NumberField item={age} />)

  await user.type(screen.getByRole('textbox', { name: /Age \(years\)/ }), '200')
  await user.tab()

  expect(screen.getByText('Must be at most 120')).toBeInTheDocument()
})

test('quantity items show the unit and store it with the value', async () => {
  const weight = makeItem({
    linkId: 'weight',
    type: 'quantity',
    text: 'Weight',
    unit: { code: 'kg', display: 'kg' },
  })
  useFormStore.getState().hydrate([weight])
  const user = userEvent.setup()
  render(<NumberField item={weight} />)

  expect(screen.getByText('Unit: kg')).toBeInTheDocument()
  await user.type(screen.getByRole('textbox', { name: /Weight/ }), '72.5')
  await user.tab()

  expect(useFormStore.getState().answers['weight']).toEqual({
    type: 'quantity',
    value: 72.5,
    unit: 'kg',
  })
})
