import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { beforeEach, expect, test } from 'vitest'
import { useFormStore } from '../../store/useFormStore'
import { makeItem } from '../../test/makeItem'
import { DateField } from './DateField'

const item = makeItem({
  linkId: 'dob',
  type: 'date',
  text: 'Date of birth',
  required: true,
})

beforeEach(() => {
  useFormStore.getState().hydrate([item])
})

test('renders a labelled date field with segments', () => {
  render(<DateField item={item} />)
  expect(
    screen.getByRole('group', { name: /Date of birth/ }),
  ).toBeInTheDocument()
  expect(screen.getAllByRole('spinbutton').length).toBeGreaterThanOrEqual(3)
})

test('typing a date into the segments writes it to the store', async () => {
  const user = userEvent.setup()
  render(<DateField item={item} />)

  await user.click(screen.getByRole('spinbutton', { name: /month/i }))
  await user.keyboard('05102021')

  expect(useFormStore.getState().answers['dob']).toEqual({
    type: 'date',
    value: '2021-05-10',
  })
})

test('shows a required error after a submit attempt', () => {
  render(<DateField item={item} />)
  expect(screen.queryByText('An answer is required')).not.toBeInTheDocument()

  act(() => {
    useFormStore.getState().attemptSubmit()
  })

  expect(screen.getByText('An answer is required')).toBeInTheDocument()
})
