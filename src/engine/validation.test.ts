import { describe, it, expect } from 'vitest'
import type { NormalizedItem } from '../parser/types'
import { validateItem } from './validation'

const item: NormalizedItem = {
  linkId: 'q1',
  type: 'string',
  required: false,
  repeats: false,
  readOnly: false,
  hidden: false,
  constraints: {},
  enableBehavior: 'any',
  children: [],
}

describe('validateItem', () => {
  it('reports no errors for an unconstrained empty value', () => {
    expect(validateItem(item, undefined)).toEqual([])
  })
})
