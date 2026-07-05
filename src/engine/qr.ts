import type { Questionnaire, QuestionnaireResponse } from 'fhir/r4'
import type { AnswerMap, NormalizedItem } from '../parser/types'

// Stub: lossless round-trip (de)serialization will be written later
export function toQuestionnaireResponse(
  _items: NormalizedItem[],
  _answers: AnswerMap,
  questionnaire: Questionnaire,
): QuestionnaireResponse {
  return {
    resourceType: 'QuestionnaireResponse',
    status: 'in-progress',
    questionnaire: questionnaire.url,
    item: [],
  }
}

export function fromQuestionnaireResponse(
  _qr: QuestionnaireResponse,
  _items: NormalizedItem[],
): AnswerMap {
  return {}
}
