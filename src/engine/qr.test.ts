import { describe, it, expect } from 'vitest'
import type { Questionnaire, QuestionnaireResponse } from 'fhir/r4'
import { fromQuestionnaireResponse, toQuestionnaireResponse } from './qr'

const questionnaire: Questionnaire = {
  resourceType: 'Questionnaire',
  status: 'active',
  url: 'http://example.org/fhir/Questionnaire/test',
}

describe('qr', () => {
  it('produces an in-progress QuestionnaireResponse referencing the questionnaire', () => {
    const qr = toQuestionnaireResponse([], {}, questionnaire)

    expect(qr.resourceType).toBe('QuestionnaireResponse')
    expect(qr.questionnaire).toBe(questionnaire.url)
  })

  it('reads an empty answer map from an empty response', () => {
    const empty: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
    }

    expect(fromQuestionnaireResponse(empty, [])).toEqual({})
  })
})
