import { beforeEach, describe, expect, it } from 'vitest'
import type { Questionnaire, QuestionnaireResponseItem } from 'fhir/r4'
import { parseQuestionnaire } from '../parser/parseQuestionnaire'
import kitchenSinkJson from '../fixtures/kitchen-sink.json'
import phq9Json from '../fixtures/phq9.json'
import type { AnswerValue } from '../engine/types'
import {
  selectErrorSummary,
  selectExportQR,
  selectIsEnabled,
  selectVisibleErrors,
  useFormStore,
  type FormState,
} from './useFormStore'

const kitchenSink = parseQuestionnaire(kitchenSinkJson as unknown as Questionnaire)
const phq9 = parseQuestionnaire(phq9Json as unknown as Questionnaire)

const state = (): FormState => useFormStore.getState()

const bool = (value: boolean): AnswerValue => ({ type: 'boolean', value })
const int = (value: number): AnswerValue => ({ type: 'integer', value })
const str = (value: string): AnswerValue => ({ type: 'string', value })
const loinc = (code: string): AnswerValue => ({
  type: 'coding',
  system: 'http://loinc.org',
  code,
})

// PHQ-9 option weights: 0 not at all, 3 nearly every day
const NOT_AT_ALL = 'LA6568-5'
const NEARLY_EVERY_DAY = 'LA6571-9'

function collectLinkIds(items: QuestionnaireResponseItem[] | undefined): string[] {
  return (items ?? []).flatMap((item) => [item.linkId, ...collectLinkIds(item.item)])
}

describe('useFormStore with the kitchen-sink questionnaire', () => {
  beforeEach(() => {
    state().hydrate(kitchenSink)
  })

  it('enables carMake only while hasCar is true', () => {
    expect(selectIsEnabled(state(), 'carMake')).toBe(false)

    state().setAnswer('hasCar', bool(true))
    expect(selectIsEnabled(state(), 'carMake')).toBe(true)

    state().setAnswer('hasCar', bool(false))
    expect(selectIsEnabled(state(), 'carMake')).toBe(false)
  })

  it('flips notes and highSat as satisfaction crosses their thresholds', () => {
    state().setAnswer('satisfaction', int(3))
    expect(selectIsEnabled(state(), 'notes')).toBe(true)
    expect(selectIsEnabled(state(), 'highSat')).toBe(false)

    state().setAnswer('satisfaction', int(9))
    expect(selectIsEnabled(state(), 'notes')).toBe(false)
    expect(selectIsEnabled(state(), 'highSat')).toBe(true)
  })

  it('flips juniorNote and adultInfo at the age-18 boundary', () => {
    state().setAnswer('age', int(17))
    expect(selectIsEnabled(state(), 'juniorNote')).toBe(true)
    expect(selectIsEnabled(state(), 'adultInfo')).toBe(false)

    state().setAnswer('age', int(18))
    expect(selectIsEnabled(state(), 'juniorNote')).toBe(false)
    expect(selectIsEnabled(state(), 'adultInfo')).toBe(true)
  })

  it('enables adultCarOwner only when hasCar is true and age is at least 18', () => {
    const cases: [boolean, number, boolean][] = [
      [true, 18, true],
      [true, 17, false],
      [false, 18, false],
      [false, 17, false],
    ]
    for (const [hasCar, age, expected] of cases) {
      state().setAnswer('hasCar', bool(hasCar))
      state().setAnswer('age', int(age))
      expect(selectIsEnabled(state(), 'adultCarOwner')).toBe(expected)
    }
  })

  it('hides required-field errors until the item is touched', () => {
    expect(state().derived.errors['firstName']).toBeDefined()
    expect(selectVisibleErrors(state(), 'firstName')).toEqual([])

    state().markTouched('firstName')
    expect(selectVisibleErrors(state(), 'firstName')).toEqual([
      { linkId: 'firstName', code: 'required', message: 'An answer is required' },
    ])
  })

  it('shows errors for untouched items after a submit attempt', () => {
    expect(selectVisibleErrors(state(), 'firstName')).toEqual([])

    state().attemptSubmit()
    expect(selectVisibleErrors(state(), 'firstName')).not.toEqual([])
  })

  it('exposes an error summary only after a submit attempt', () => {
    expect(selectErrorSummary(state())).toEqual([])

    state().attemptSubmit()
    const summary = selectErrorSummary(state())
    expect(summary.map(({ linkId }) => linkId)).toEqual(
      expect.arrayContaining(['firstName', 'contactMethod']),
    )
  })

  it('attemptSubmit returns false with required fields empty and true once satisfied', () => {
    expect(state().attemptSubmit()).toBe(false)

    state().setAnswer('firstName', str('Ada'))
    state().setAnswer('contactMethod', {
      type: 'coding',
      system: 'http://example.org/contact',
      code: 'email',
    })
    expect(state().attemptSubmit()).toBe(true)
  })

  it('exports a QR without disabled or hidden items and round-trips the rest', () => {
    state().setAnswer('firstName', str('Ada'))
    state().setAnswer('age', int(30))
    state().setAnswer('hasCar', bool(false))
    state().setAnswer('carMake', str('Toyota'))
    state().setAnswer('internalRef', str('ref-123'))

    const qr = selectExportQR(state())
    const linkIds = collectLinkIds(qr.item)
    expect(linkIds).not.toContain('carMake')
    expect(linkIds).not.toContain('internalRef')
    expect(linkIds).toEqual(expect.arrayContaining(['firstName', 'age', 'hasCar']))

    state().loadFromQR(qr)
    expect(state().answers).toEqual({
      firstName: str('Ada'),
      age: int(30),
      hasCar: bool(false),
    })
  })

  it('reset clears answers, touched, and submitAttempted and recomputes derived state', () => {
    state().setAnswer('hasCar', bool(true))
    state().markTouched('hasCar')
    state().attemptSubmit()

    state().reset()
    expect(state().answers).toEqual({})
    expect(state().touched).toEqual({})
    expect(state().submitAttempted).toBe(false)
    expect(selectIsEnabled(state(), 'carMake')).toBe(false)
    expect(selectIsEnabled(state(), 'firstName')).toBe(true)
    expect(state().derived.score.total).toBe(0)
  })
})

describe('useFormStore with the PHQ-9 questionnaire', () => {
  beforeEach(() => {
    state().hydrate(phq9)
  })

  const answerAllNine = (code: string): void => {
    for (let i = 1; i <= 9; i += 1) state().setAnswer(`q${i}`, loinc(code))
  }

  it('scores all nine answers "Nearly every day" as 27', () => {
    answerAllNine(NEARLY_EVERY_DAY)
    expect(state().derived.score.total).toBe(27)
  })

  it('scores all nine answers "Not at all" as 0', () => {
    answerAllNine(NOT_AT_ALL)
    expect(state().derived.score.total).toBe(0)
  })
})
