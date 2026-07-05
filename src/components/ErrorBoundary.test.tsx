import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Bomb(): never {
  throw new Error('boom')
}

afterEach(() => {
  vi.restoreAllMocks()
})

test('a render error shows the friendly fallback instead of a blank screen', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})

  render(
    <ErrorBoundary>
      <Bomb />
    </ErrorBoundary>,
  )

  expect(screen.getByRole('alert')).toHaveTextContent(
    'This questionnaire could not be displayed',
  )
  expect(screen.getByRole('button', { name: 'Reload page' })).toBeVisible()
})

test('children render untouched when nothing throws', () => {
  render(
    <ErrorBoundary>
      <p>all good</p>
    </ErrorBoundary>,
  )

  expect(screen.getByText('all good')).toBeVisible()
  expect(screen.queryByRole('alert')).toBeNull()
})
