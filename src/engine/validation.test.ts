import { describe, it, expect } from 'vitest'
import type { Questionnaire } from 'fhir/r4'
import { parseQuestionnaire } from '../parser/parseQuestionnaire'
import type { NormalizedItem } from '../parser/types'
import kitchenSinkJson from '../fixtures/kitchen-sink.json'
import type { AnswerValue } from './types'
import { validateForm, validateItem } from './validation'

const kitchenSink = parseQuestionnaire(
  kitchenSinkJson as unknown as Questionnaire,
)

function get(linkId: string): NormalizedItem {
  const find = (list: NormalizedItem[]): NormalizedItem | undefined => {
    for (const item of list) {
      if (item.linkId === linkId) return item
      const found = find(item.children)
      if (found) return found
    }
    return undefined
  }
  const item = find(kitchenSink)
  if (!item) throw new Error(`no parsed item with linkId "${linkId}"`)
  return item
}

const str = (value: string): AnswerValue => ({ type: 'string', value })
const int = (value: number): AnswerValue => ({ type: 'integer', value })

const codes = (errors: { code: string }[]): string[] =>
  errors.map((error) => error.code)
const linkIds = (errors: { linkId: string }[]): string[] =>
  errors.map((error) => error.linkId)

describe('validateItem', () => {
  it('fails a required firstName when empty and passes when answered', () => {
    const firstName = get('firstName')
    expect(codes(validateItem(firstName, undefined))).toEqual(['required'])
    expect(codes(validateItem(firstName, str('')))).toEqual(['required'])
    expect(validateItem(firstName, str('Ada'))).toEqual([])
  })

  it('enforces the maxLength 50 boundary on firstName', () => {
    const firstName = get('firstName')
    expect(validateItem(firstName, str('a'.repeat(50)))).toEqual([])
    expect(codes(validateItem(firstName, str('a'.repeat(51))))).toEqual([
      'maxLength',
    ])
  })

  it('validates postalCode against its regex', () => {
    const postalCode = get('postalCode')
    expect(validateItem(postalCode, str('48009'))).toEqual([])
    expect(validateItem(postalCode, str('48009-1234'))).toEqual([])
    expect(codes(validateItem(postalCode, str('4800')))).toEqual(['pattern'])
  })

  it('enforces the age 0-120 range at its boundaries', () => {
    const age = get('age')
    expect(codes(validateItem(age, int(-1)))).toEqual(['min'])
    expect(validateItem(age, int(0))).toEqual([])
    expect(validateItem(age, int(120))).toEqual([])
    expect(codes(validateItem(age, int(121)))).toEqual(['max'])
  })

  it('enforces max dates on dob', () => {
    const dob = get('dob')
    expect(validateItem(dob, { type: 'date', value: '1990-01-01' })).toEqual([])
    expect(
      codes(validateItem(dob, { type: 'date', value: '2030-01-01' })),
    ).toEqual(['maxDate'])
  })

  it('reports structured errors carrying the item linkId', () => {
    const [error] = validateItem(get('firstName'), undefined)
    expect(error?.linkId).toBe('firstName')
    expect(error?.code).toBe('required')
    expect(typeof error?.message).toBe('string')
  })
})

describe('validateForm', () => {
  it('skips a disabled carMake even though it is required', () => {
    // hasCar is unanswered, so the required carMake is disabled
    const errors = validateForm(kitchenSink, { firstName: str('Ada') })
    expect(linkIds(errors)).not.toContain('carMake')
  })

  it('reports carMake once hasCar enables it', () => {
    const errors = validateForm(kitchenSink, {
      firstName: str('Ada'),
      hasCar: { type: 'boolean', value: true },
    })
    expect(linkIds(errors)).toContain('carMake')
  })

  it('skips hidden items', () => {
    const errors = validateForm(kitchenSink, {})
    expect(linkIds(errors)).not.toContain('internalRef')
  })
})
