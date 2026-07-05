import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import type { NormalizedAnswerOption } from '../../parser/types'
import { useFormStore } from '../../store/useFormStore'
import { makeItem } from '../../test/makeItem'
import { MultiChoiceField } from './MultiChoiceField'

const options: NormalizedAnswerOption[] = [
  { code: 'http://x|tech', display: 'Technology', valueType: 'coding' },
  { code: 'http://x|design', display: 'Design', valueType: 'coding' },
  { code: 'http://x|sports', display: 'Sports', valueType: 'coding' },
]

const item = makeItem({
  linkId: 'interests',
  type: 'choice',
  text: 'Interests (select all that apply)',
  repeats: true,
  control: 'check-box',
  options,
})

beforeEach(() => {
  useFormStore.getState().hydrate([item])
})

test('renders a checkbox group named by the question text', () => {
  render(<MultiChoiceField item={item} />)
  expect(
    screen.getByRole('group', { name: /Interests \(select all that apply\)/ }),
  ).toBeInTheDocument()
  expect(screen.getAllByRole('checkbox')).toHaveLength(3)
})

test('checking options stores an array of codings', async () => {
  const user = userEvent.setup()
  render(<MultiChoiceField item={item} />)

  await user.click(screen.getByRole('checkbox', { name: 'Technology' }))
  await user.click(screen.getByRole('checkbox', { name: 'Sports' }))

  expect(useFormStore.getState().answers['interests']).toEqual([
    { type: 'coding', system: 'http://x', code: 'tech', display: 'Technology' },
    { type: 'coding', system: 'http://x', code: 'sports', display: 'Sports' },
  ])
})

test('unchecking an option removes it from the stored array', async () => {
  const user = userEvent.setup()
  render(<MultiChoiceField item={item} />)

  await user.click(screen.getByRole('checkbox', { name: 'Technology' }))
  await user.click(screen.getByRole('checkbox', { name: 'Sports' }))
  await user.click(screen.getByRole('checkbox', { name: 'Technology' }))

  expect(useFormStore.getState().answers['interests']).toEqual([
    { type: 'coding', system: 'http://x', code: 'sports', display: 'Sports' },
  ])
})
