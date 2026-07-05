import { describe, it, expect } from 'vitest'
import type { Questionnaire } from 'fhir/r4'
import { parseQuestionnaire } from '../parser/parseQuestionnaire'
import phq9Json from '../fixtures/phq9.json'
import kitchenSinkJson from '../fixtures/kitchen-sink.json'
import { computeScore } from './scoring'
import type { AnswerMap, AnswerValue } from './types'

const phq9 = parseQuestionnaire(phq9Json as unknown as Questionnaire)
const kitchenSink = parseQuestionnaire(
  kitchenSinkJson as unknown as Questionnaire,
)

const loinc = (code: string): AnswerValue => ({
  type: 'coding',
  system: 'http://loinc.org',
  code,
})

// PHQ-9 option weights: 0 not at all, 1 several days, 2 more than half, 3 nearly every day
const NOT_AT_ALL = 'LA6568-5'
const SEVERAL_DAYS = 'LA6569-3'
const MORE_THAN_HALF = 'LA6570-1'
const NEARLY_EVERY_DAY = 'LA6571-9'

const allNine = (code: string): AnswerMap =>
  Object.fromEntries(
    Array.from({ length: 9 }, (_, i) => [`q${i + 1}`, loinc(code)]),
  )

describe('computeScore', () => {
  it('scores an empty form as zero', () => {
    expect(computeScore([], {})).toEqual({ total: 0 })
  })

  it('scores all nine PHQ-9 answers "Not at all" as 0', () => {
    expect(computeScore(phq9, allNine(NOT_AT_ALL)).total).toBe(0)
  })

  it('scores all nine PHQ-9 answers "Nearly every day" as 27', () => {
    expect(computeScore(phq9, allNine(NEARLY_EVERY_DAY)).total).toBe(27)
  })

  it('scores a hand-computed mixed PHQ-9 set exactly', () => {
    // 1 + 2 + 3 + 0 + 1 + 2 + 0 + 3 + 1 = 13
    const mixed: AnswerMap = {
      q1: loinc(SEVERAL_DAYS),
      q2: loinc(MORE_THAN_HALF),
      q3: loinc(NEARLY_EVERY_DAY),
      q4: loinc(NOT_AT_ALL),
      q5: loinc(SEVERAL_DAYS),
      q6: loinc(MORE_THAN_HALF),
      q7: loinc(NOT_AT_ALL),
      q8: loinc(NEARLY_EVERY_DAY),
      q9: loinc(SEVERAL_DAYS),
    }
    expect(computeScore(phq9, mixed).total).toBe(13)

    // difficulty is unscored, so answering it never changes the total
    const withDifficulty: AnswerMap = {
      ...mixed,
      difficulty: loinc('LA6573-5'),
    }
    expect(computeScore(phq9, withDifficulty).total).toBe(13)
  })

  it('reports weighted answers under their group in byGroup', () => {
    const answers: AnswerMap = {
      contactMethod: {
        type: 'coding',
        system: 'http://example.org/contact',
        code: 'phone',
      },
    }
    expect(computeScore(kitchenSink, answers)).toEqual({
      total: 2,
      byGroup: { 'g-preferences': 2 },
    })
  })

  it('gives unanswered scorable items a score of 0', () => {
    expect(computeScore(phq9, {}).total).toBe(0)
  })
})
