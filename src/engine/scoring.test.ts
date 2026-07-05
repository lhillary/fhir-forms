import { describe, it, expect } from 'vitest'
import { computeScore } from './scoring'

describe('computeScore', () => {
  it('scores an empty form as zero', () => {
    expect(computeScore([], {})).toEqual({ total: 0 })
  })
})
