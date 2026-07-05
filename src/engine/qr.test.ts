import { describe, it, expect } from 'vitest'
import type { Questionnaire, QuestionnaireResponseItem } from 'fhir/r4'
import { parseQuestionnaire } from '../parser/parseQuestionnaire'
import kitchenSinkJson from '../fixtures/kitchen-sink.json'
import { fromQuestionnaireResponse, toQuestionnaireResponse } from './qr'
import type { AnswerMap } from './types'

const questionnaire = kitchenSinkJson as unknown as Questionnaire
const kitchenSink = parseQuestionnaire(questionnaire)

// All answered items are enabled under these answers, so the round-trip must
// reproduce the map exactly.
const answers: AnswerMap = {
  firstName: { type: 'string', value: 'Ada' },
  postalCode: { type: 'string', value: '48009' },
  dob: { type: 'date', value: '1995-05-01' },
  age: { type: 'integer', value: 30 },
  heightM: { type: 'decimal', value: 1.7 },
  weight: { type: 'quantity', value: 65, unit: 'kg' },
  subscribe: { type: 'boolean', value: true },
  contactMethod: {
    type: 'coding',
    system: 'http://example.org/contact',
    code: 'phone',
    display: 'Phone',
  },
  hearAbout: { type: 'string', value: 'Search engine' },
  interests: [
    { type: 'coding', system: 'http://example.org/interest', code: 'tech' },
    { type: 'coding', system: 'http://example.org/interest', code: 'music' },
  ],
  satisfaction: { type: 'integer', value: 7 },
  hasCar: { type: 'boolean', value: true },
  carMake: { type: 'string', value: 'Toyota' },
}

function collectLinkIds(
  items: QuestionnaireResponseItem[] | undefined,
): string[] {
  return (items ?? []).flatMap((item) => [
    item.linkId,
    ...collectLinkIds(item.item),
  ])
}

describe('toQuestionnaireResponse', () => {
  it('produces a completed QuestionnaireResponse referencing the questionnaire', () => {
    const qr = toQuestionnaireResponse(kitchenSink, answers, questionnaire)
    expect(qr.resourceType).toBe('QuestionnaireResponse')
    expect(qr.status).toBe('completed')
    expect(qr.questionnaire).toBe(questionnaire.url)
  })

  it('preserves group nesting as QR item nesting', () => {
    const qr = toQuestionnaireResponse(kitchenSink, answers, questionnaire)
    const demographics = qr.item?.find(
      (item) => item.linkId === 'g-demographics',
    )
    expect(demographics).toBeDefined()
    expect(collectLinkIds(demographics?.item)).toContain('firstName')
  })

  it('excludes a disabled item answer from the QR', () => {
    // hasCar=false disables carMake, so its stray answer must not be exported
    const withDisabled: AnswerMap = {
      hasCar: { type: 'boolean', value: false },
      carMake: { type: 'string', value: 'Toyota' },
    }
    const qr = toQuestionnaireResponse(kitchenSink, withDisabled, questionnaire)
    expect(collectLinkIds(qr.item)).not.toContain('carMake')
    expect(collectLinkIds(qr.item)).toContain('hasCar')
  })

  it('excludes hidden items from the QR', () => {
    const withHidden: AnswerMap = {
      internalRef: { type: 'string', value: 'ref-123' },
    }
    const qr = toQuestionnaireResponse(kitchenSink, withHidden, questionnaire)
    expect(collectLinkIds(qr.item)).not.toContain('internalRef')
  })
})

describe('round-trip', () => {
  it('reproduces the answer map exactly across all supported types', () => {
    const qr = toQuestionnaireResponse(kitchenSink, answers, questionnaire)
    expect(fromQuestionnaireResponse(qr, kitchenSink)).toEqual(answers)
  })

  it('reads an empty answer map from an empty response', () => {
    const qr = toQuestionnaireResponse(kitchenSink, {}, questionnaire)
    expect(fromQuestionnaireResponse(qr, kitchenSink)).toEqual({})
  })
})
