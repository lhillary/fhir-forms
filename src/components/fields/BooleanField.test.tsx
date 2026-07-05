import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import { useFormStore } from '../../store/useFormStore'
import { makeItem } from '../../test/makeItem'
import { BooleanField } from './BooleanField'

const item = makeItem({
  linkId: 'subscribe',
  type: 'boolean',
  text: 'Subscribe to product updates',
})

beforeEach(() => {
  useFormStore.getState().hydrate([item])
})

test('renders a labelled checkbox', () => {
  render(<BooleanField item={item} />)
  expect(
    screen.getByRole('checkbox', { name: 'Subscribe to product updates' }),
  ).not.toBeChecked()
})

test('clicking the checkbox toggles the stored answer', async () => {
  const user = userEvent.setup()
  render(<BooleanField item={item} />)

  const checkbox = screen.getByRole('checkbox', {
    name: 'Subscribe to product updates',
  })
  await user.click(checkbox)
  expect(useFormStore.getState().answers['subscribe']).toEqual({
    type: 'boolean',
    value: true,
  })

  await user.click(checkbox)
  expect(useFormStore.getState().answers['subscribe']).toEqual({
    type: 'boolean',
    value: false,
  })
})

test('space toggles the checkbox with the keyboard', async () => {
  const user = userEvent.setup()
  render(<BooleanField item={item} />)

  await user.tab()
  expect(
    screen.getByRole('checkbox', { name: 'Subscribe to product updates' }),
  ).toHaveFocus()
  await user.keyboard(' ')

  expect(useFormStore.getState().answers['subscribe']).toEqual({
    type: 'boolean',
    value: true,
  })
})
