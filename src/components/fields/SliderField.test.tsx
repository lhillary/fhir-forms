import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import { useFormStore } from '../../store/useFormStore'
import { makeItem } from '../../test/makeItem'
import { SliderField } from './SliderField'

const item = makeItem({
  linkId: 'satisfaction',
  type: 'integer',
  text: 'Overall satisfaction (0-10)',
  control: 'slider',
  slider: { min: 0, max: 10, step: 1 },
})

beforeEach(() => {
  useFormStore.getState().hydrate([item])
})

test('renders a labelled slider', () => {
  render(<SliderField item={item} />)
  expect(
    screen.getByRole('slider', { name: /Overall satisfaction/ }),
  ).toBeInTheDocument()
})

test('arrow keys move the value and write it to the store', async () => {
  const user = userEvent.setup()
  render(<SliderField item={item} />)

  await user.tab()
  await user.keyboard('{ArrowRight}')

  expect(useFormStore.getState().answers['satisfaction']).toEqual({
    type: 'integer',
    value: 1,
  })
})

test('End jumps to the maximum value', async () => {
  const user = userEvent.setup()
  render(<SliderField item={item} />)

  await user.tab()
  await user.keyboard('{End}')

  expect(useFormStore.getState().answers['satisfaction']).toEqual({
    type: 'integer',
    value: 10,
  })
})
