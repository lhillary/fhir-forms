import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { beforeEach, expect, test } from 'vitest'
import { useFormStore } from '../../store/useFormStore'
import { makeItem } from '../../test/makeItem'
import { TextInputField } from './TextInputField'

const item = makeItem({
  linkId: 'firstName',
  type: 'string',
  text: 'First name',
  required: true,
})

beforeEach(() => {
  useFormStore.getState().hydrate([item])
})

test('renders a labelled text input', () => {
  render(<TextInputField item={item} />)
  const input = screen.getByRole('textbox', { name: /First name/ })
  expect(input).toBeRequired()
})

test('writes typed text to the store', async () => {
  const user = userEvent.setup()
  render(<TextInputField item={item} />)
  await user.type(screen.getByRole('textbox', { name: /First name/ }), 'Ada')
  expect(useFormStore.getState().answers['firstName']).toEqual({
    type: 'string',
    value: 'Ada',
  })
})

test('renders a textarea for text items', () => {
  const textItem = makeItem({ linkId: 'notes', type: 'text', text: 'Notes' })
  useFormStore.getState().hydrate([textItem])
  render(<TextInputField item={textItem} />)
  expect(screen.getByRole('textbox', { name: /Notes/ }).tagName).toBe(
    'TEXTAREA',
  )
})

test('shows a required error only after the field is touched', async () => {
  const user = userEvent.setup()
  render(<TextInputField item={item} />)
  expect(screen.queryByText('An answer is required')).not.toBeInTheDocument()

  await user.click(screen.getByRole('textbox', { name: /First name/ }))
  await user.tab()

  expect(screen.getByText('An answer is required')).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: /First name/ })).toHaveAttribute(
    'aria-invalid',
    'true',
  )
})

test('shows a required error after a submit attempt without touching', () => {
  render(<TextInputField item={item} />)
  expect(screen.queryByText('An answer is required')).not.toBeInTheDocument()

  act(() => {
    useFormStore.getState().attemptSubmit()
  })

  expect(screen.getByText('An answer is required')).toBeInTheDocument()
})
