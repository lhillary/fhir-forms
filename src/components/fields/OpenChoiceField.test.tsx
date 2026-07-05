import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { beforeEach, expect, test } from 'vitest'
import type { NormalizedAnswerOption } from '../../parser/types'
import { useFormStore } from '../../store/useFormStore'
import { makeItem } from '../../test/makeItem'
import { OpenChoiceField } from './OpenChoiceField'

const options: NormalizedAnswerOption[] = [
  { code: 'Search engine', display: 'Search engine', valueType: 'string' },
  {
    code: 'Friend or colleague',
    display: 'Friend or colleague',
    valueType: 'string',
  },
]

const item = makeItem({
  linkId: 'hearAbout',
  type: 'open-choice',
  text: 'How did you hear about us?',
  required: true,
  options,
})

beforeEach(() => {
  useFormStore.getState().hydrate([item])
})

test('renders the options plus an Other radio', () => {
  render(<OpenChoiceField item={item} />)
  expect(
    screen.getByRole('radiogroup', { name: /How did you hear about us\?/ }),
  ).toBeInTheDocument()
  expect(screen.getAllByRole('radio')).toHaveLength(3)
  expect(screen.getByRole('radio', { name: 'Other' })).toBeInTheDocument()
})

test('selecting a listed option stores its value', async () => {
  const user = userEvent.setup()
  render(<OpenChoiceField item={item} />)

  await user.click(screen.getByText('Search engine'))

  expect(useFormStore.getState().answers['hearAbout']).toEqual({
    type: 'string',
    value: 'Search engine',
  })
})

test('typing free text stores it and selects the Other radio', async () => {
  const user = userEvent.setup()
  render(<OpenChoiceField item={item} />)

  await user.type(
    screen.getByRole('textbox', { name: 'Other — please specify' }),
    'Billboard',
  )

  expect(useFormStore.getState().answers['hearAbout']).toEqual({
    type: 'string',
    value: 'Billboard',
  })
  expect(screen.getByRole('radio', { name: 'Other' })).toBeChecked()
})

test('shows a required error after a submit attempt', () => {
  render(<OpenChoiceField item={item} />)
  act(() => {
    useFormStore.getState().attemptSubmit()
  })
  expect(screen.getByText('An answer is required')).toBeInTheDocument()
})
