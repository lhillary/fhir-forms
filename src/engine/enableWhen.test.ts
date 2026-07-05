import { describe, it, expect } from 'vitest'
import type { Questionnaire } from 'fhir/r4'
import { parseQuestionnaire } from '../parser/parseQuestionnaire'
import type { NormalizedItem } from '../parser/types'
import kitchenSinkJson from '../fixtures/kitchen-sink.json'
import { computeEnabledSet, isItemEnabled } from './enableWhen'
import type { AnswerMap, AnswerValue } from './types'

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

const bool = (value: boolean): AnswerValue => ({ type: 'boolean', value })
const int = (value: number): AnswerValue => ({ type: 'integer', value })
const contact = (code: string): AnswerValue => ({
  type: 'coding',
  system: 'http://example.org/contact',
  code,
})

describe('isItemEnabled', () => {
  it('treats an item with no conditions as enabled', () => {
    expect(isItemEnabled(get('hasCar'), {})).toBe(true)
  })

  it('keeps carMake disabled until hasCar is true', () => {
    const carMake = get('carMake')
    expect(isItemEnabled(carMake, {})).toBe(false)
    expect(isItemEnabled(carMake, { hasCar: bool(false) })).toBe(false)
    expect(isItemEnabled(carMake, { hasCar: bool(true) })).toBe(true)
  })

  it('enables notes only when satisfaction < 5', () => {
    const notes = get('notes')
    expect(isItemEnabled(notes, {})).toBe(false)
    expect(isItemEnabled(notes, { satisfaction: int(4) })).toBe(true)
    expect(isItemEnabled(notes, { satisfaction: int(5) })).toBe(false)
  })

  it('enables highSat only when satisfaction > 8', () => {
    const highSat = get('highSat')
    expect(isItemEnabled(highSat, { satisfaction: int(8) })).toBe(false)
    expect(isItemEnabled(highSat, { satisfaction: int(9) })).toBe(true)
  })

  it('enables juniorNote at age 17 and disables it at 18', () => {
    const juniorNote = get('juniorNote')
    expect(isItemEnabled(juniorNote, { age: int(17) })).toBe(true)
    expect(isItemEnabled(juniorNote, { age: int(18) })).toBe(false)
  })

  it('enables adultInfo at age 18 and disables it at 17', () => {
    const adultInfo = get('adultInfo')
    expect(isItemEnabled(adultInfo, { age: int(18) })).toBe(true)
    expect(isItemEnabled(adultInfo, { age: int(17) })).toBe(false)
  })

  it('enables nonEmailContact when contactMethod != email', () => {
    const nonEmailContact = get('nonEmailContact')
    expect(
      isItemEnabled(nonEmailContact, { contactMethod: contact('phone') }),
    ).toBe(true)
    expect(
      isItemEnabled(nonEmailContact, { contactMethod: contact('email') }),
    ).toBe(false)
  })

  it('treats != as false while the referenced question is unanswered', () => {
    expect(isItemEnabled(get('nonEmailContact'), {})).toBe(false)
  })

  it('enables anyContact (exists) only once contactMethod is answered', () => {
    const anyContact = get('anyContact')
    expect(isItemEnabled(anyContact, {})).toBe(false)
    expect(isItemEnabled(anyContact, { contactMethod: contact('mail') })).toBe(
      true,
    )
  })

  it("requires every condition for adultCarOwner (behavior 'all')", () => {
    const adultCarOwner = get('adultCarOwner')
    const combos: [boolean, number, boolean][] = [
      [false, 17, false],
      [false, 18, false],
      [true, 17, false],
      [true, 18, true],
    ]
    for (const [hasCar, age, expected] of combos) {
      expect(
        isItemEnabled(adultCarOwner, { hasCar: bool(hasCar), age: int(age) }),
      ).toBe(expected)
    }
  })

  it("requires any condition for engagedUser (behavior 'any')", () => {
    const engagedUser = get('engagedUser')
    const combos: [boolean, number, boolean][] = [
      [false, 8, false],
      [true, 8, true],
      [false, 9, true],
      [true, 9, true],
    ]
    for (const [subscribe, satisfaction, expected] of combos) {
      expect(
        isItemEnabled(engagedUser, {
          subscribe: bool(subscribe),
          satisfaction: int(satisfaction),
        }),
      ).toBe(expected)
    }
  })

  it('treats a comparison against a non-orderable answer as false', () => {
    const highSat = get('highSat')
    const notNumeric: AnswerMap = {
      satisfaction: { type: 'string', value: '9' },
    }
    expect(isItemEnabled(highSat, notNumeric)).toBe(false)
  })
})

describe('computeEnabledSet', () => {
  it('disables descendants of a disabled ancestor and ignores answers of disabled questions', () => {
    const enabled = computeEnabledSet(kitchenSink, {
      hasCar: bool(true),
      age: int(30),
    })
    expect(enabled.has('carMake')).toBe(true)
    expect(enabled.has('adultCarOwner')).toBe(true)
    expect(enabled.has('juniorNote')).toBe(false)
  })

  it('treats an answer belonging to a disabled question as unanswered', () => {
    // carMake is disabled (hasCar unanswered), so its stray answer must not count
    const items: NormalizedItem[] = [
      ...kitchenSink,
      {
        linkId: 'dependsOnCarMake',
        type: 'display',
        required: false,
        repeats: false,
        readOnly: false,
        hidden: false,
        constraints: {},
        enableBehavior: 'any',
        children: [],
        enableWhen: [
          {
            question: 'carMake',
            operator: 'exists',
            answer: { kind: 'boolean', value: true },
          },
        ],
      },
    ]
    const enabled = computeEnabledSet(items, {
      carMake: { type: 'string', value: 'Toyota' },
    })
    expect(enabled.has('carMake')).toBe(false)
    expect(enabled.has('dependsOnCarMake')).toBe(false)
  })
})
