import { describe, it, expect } from 'vitest'
import type { Questionnaire } from 'fhir/r4'
import { parseQuestionnaire } from './parseQuestionnaire'

describe('parseQuestionnaire', () => {
  it('returns an empty tree for a questionnaire with no items', () => {
    const questionnaire: Questionnaire = { resourceType: 'Questionnaire', status: 'active' }

    expect(parseQuestionnaire(questionnaire)).toEqual([])
  })
})
