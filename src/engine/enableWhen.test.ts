import { describe, it, expect } from 'vitest'
import type { NormalizedItem } from '../parser/types'
import { isItemEnabled } from './enableWhen'

const item: NormalizedItem = {
  linkId: 'q1',
  type: 'boolean',
  required: false,
  repeats: false,
  readOnly: false,
  hidden: false,
  constraints: {},
  enableBehavior: 'any',
  children: [],
}

describe('isItemEnabled', () => {
  it('treats an item with no conditions as enabled', () => {
    expect(isItemEnabled(item, {})).toBe(true)
  })
})
