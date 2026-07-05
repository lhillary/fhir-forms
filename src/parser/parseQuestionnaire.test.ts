import { describe, expect, it } from 'vitest'
import type { Questionnaire } from 'fhir/r4'
import { parseQuestionnaire } from './parseQuestionnaire'
import type { NormalizedItem } from './types'
import phq9Json from '../fixtures/phq9.json'
import kitchenSinkJson from '../fixtures/kitchen-sink.json'

const phq9 = parseQuestionnaire(phq9Json as unknown as Questionnaire)
const kitchenSink = parseQuestionnaire(
  kitchenSinkJson as unknown as Questionnaire,
)

function indexByLinkId(items: NormalizedItem[]): Map<string, NormalizedItem> {
  const map = new Map<string, NormalizedItem>()
  const walk = (list: NormalizedItem[]): void => {
    for (const item of list) {
      map.set(item.linkId, item)
      walk(item.children)
    }
  }
  walk(items)
  return map
}

function get(map: Map<string, NormalizedItem>, linkId: string): NormalizedItem {
  const item = map.get(linkId)
  if (!item) throw new Error(`no parsed item with linkId "${linkId}"`)
  return item
}

const phq9Items = indexByLinkId(phq9)
const kitchenSinkItems = indexByLinkId(kitchenSink)

describe('parseQuestionnaire', () => {
  it('returns an empty tree for a questionnaire with no items', () => {
    const questionnaire: Questionnaire = {
      resourceType: 'Questionnaire',
      status: 'active',
    }

    expect(parseQuestionnaire(questionnaire)).toEqual([])
  })
})

describe('PHQ-9', () => {
  it('parses to 11 top-level items: intro display, q1..q9, and difficulty', () => {
    expect(phq9).toHaveLength(11)
    expect(phq9.map((item) => item.linkId)).toEqual([
      'intro',
      'q1',
      'q2',
      'q3',
      'q4',
      'q5',
      'q6',
      'q7',
      'q8',
      'q9',
      'difficulty',
    ])
    expect(get(phq9Items, 'intro').type).toBe('display')
  })

  it('parses q1 as a required radio-button choice with 4 coding options weighted 0..3', () => {
    const q1 = get(phq9Items, 'q1')

    expect(q1.type).toBe('choice')
    expect(q1.required).toBe(true)
    expect(q1.control).toBe('radio-button')
    expect(q1.options).toHaveLength(4)
    expect(q1.options?.map((option) => option.weight)).toEqual([0, 1, 2, 3])
    expect(q1.options?.every((option) => option.valueType === 'coding')).toBe(
      true,
    )
  })

  it('parses difficulty as an optional unscored drop-down with 4 options', () => {
    const difficulty = get(phq9Items, 'difficulty')

    expect(difficulty.required).toBe(false)
    expect(difficulty.control).toBe('drop-down')
    expect(difficulty.options).toHaveLength(4)
    expect(
      difficulty.options?.every((option) => option.weight === undefined),
    ).toBe(true)
  })
})

describe('kitchen-sink', () => {
  it('preserves the nested group tree with the expected child counts', () => {
    expect(get(kitchenSinkItems, 'g-demographics').children).toHaveLength(6)
    expect(get(kitchenSinkItems, 'g-preferences').children).toHaveLength(7)
    expect(get(kitchenSinkItems, 'g-conditional').children).toHaveLength(10)
    expect(get(kitchenSinkItems, 'g-edge-cases').children).toHaveLength(2)
  })

  it('parses firstName as a required string with maxLength 50', () => {
    const firstName = get(kitchenSinkItems, 'firstName')

    expect(firstName.type).toBe('string')
    expect(firstName.required).toBe(true)
    expect(firstName.constraints.maxLength).toBe(50)
  })

  it('resolves the regex extension on postalCode', () => {
    expect(get(kitchenSinkItems, 'postalCode').constraints.regex).toBe(
      '^\\d{5}(-\\d{4})?$',
    )
  })

  it('resolves a date maxValue extension on dob into constraints.maxDate', () => {
    const dob = get(kitchenSinkItems, 'dob')

    expect(dob.type).toBe('date')
    expect(dob.constraints.maxDate).toBe('2026-07-05')
  })

  it('resolves integer min/max value extensions on age', () => {
    const age = get(kitchenSinkItems, 'age')

    expect(age.type).toBe('integer')
    expect(age.constraints.minValue).toBe(0)
    expect(age.constraints.maxValue).toBe(120)
  })

  it('resolves decimal min/max value extensions on heightM', () => {
    const heightM = get(kitchenSinkItems, 'heightM')

    expect(heightM.type).toBe('decimal')
    expect(heightM.constraints.minValue).toBe(0)
    expect(heightM.constraints.maxValue).toBe(3)
  })

  it('resolves the questionnaire-unit extension on weight', () => {
    const weight = get(kitchenSinkItems, 'weight')

    expect(weight.type).toBe('quantity')
    expect(weight.unit?.code).toBe('kg')
  })

  it('parses contactMethod as a radio-button with 3 options weighted 1..3', () => {
    const contactMethod = get(kitchenSinkItems, 'contactMethod')

    expect(contactMethod.control).toBe('radio-button')
    expect(contactMethod.options).toHaveLength(3)
    expect(contactMethod.options?.map((option) => option.weight)).toEqual([
      1, 2, 3,
    ])
  })

  it('parses country as a drop-down with 4 options', () => {
    const country = get(kitchenSinkItems, 'country')

    expect(country.control).toBe('drop-down')
    expect(country.options).toHaveLength(4)
  })

  it('parses hearAbout as open-choice with 3 string-valued options', () => {
    const hearAbout = get(kitchenSinkItems, 'hearAbout')

    expect(hearAbout.type).toBe('open-choice')
    expect(hearAbout.options).toHaveLength(3)
    expect(
      hearAbout.options?.every((option) => option.valueType === 'string'),
    ).toBe(true)
  })

  it('parses interests as a repeating check-box choice with 4 options', () => {
    const interests = get(kitchenSinkItems, 'interests')

    expect(interests.type).toBe('choice')
    expect(interests.repeats).toBe(true)
    expect(interests.control).toBe('check-box')
    expect(interests.options).toHaveLength(4)
  })

  it('parses language as an autocomplete with 8 options', () => {
    const language = get(kitchenSinkItems, 'language')

    expect(language.control).toBe('autocomplete')
    expect(language.options).toHaveLength(8)
  })

  it('resolves slider extensions on satisfaction', () => {
    const satisfaction = get(kitchenSinkItems, 'satisfaction')

    expect(satisfaction.type).toBe('integer')
    expect(satisfaction.control).toBe('slider')
    expect(satisfaction.slider).toEqual({ min: 0, max: 10, step: 1 })
  })

  it('normalizes a boolean = enableWhen condition on carMake', () => {
    const carMake = get(kitchenSinkItems, 'carMake')

    expect(carMake.required).toBe(true)
    expect(carMake.enableWhen?.[0]).toEqual({
      question: 'hasCar',
      operator: '=',
      answer: { kind: 'boolean', value: true },
    })
  })

  it('normalizes a coding != enableWhen condition on nonEmailContact', () => {
    const condition = get(kitchenSinkItems, 'nonEmailContact').enableWhen?.[0]

    expect(condition?.operator).toBe('!=')
    expect(condition?.answer.kind).toBe('coding')
    expect(condition?.answer.kind === 'coding' && condition.answer.code).toBe(
      'email',
    )
  })

  it('normalizes an integer >= enableWhen condition on adultInfo', () => {
    const condition = get(kitchenSinkItems, 'adultInfo').enableWhen?.[0]

    expect(condition?.operator).toBe('>=')
    expect(condition?.answer).toEqual({ kind: 'integer', value: 18 })
  })

  it('normalizes the remaining comparison operators', () => {
    expect(get(kitchenSinkItems, 'juniorNote').enableWhen?.[0]?.operator).toBe(
      '<=',
    )
    expect(get(kitchenSinkItems, 'highSat').enableWhen?.[0]?.operator).toBe('>')

    const notes = get(kitchenSinkItems, 'notes')
    expect(notes.enableWhen?.[0]?.operator).toBe('<')
    expect(notes.type).toBe('text')
    expect(notes.constraints.maxLength).toBe(500)
  })

  it('normalizes an exists enableWhen condition on anyContact', () => {
    expect(get(kitchenSinkItems, 'anyContact').enableWhen?.[0]).toEqual({
      question: 'contactMethod',
      operator: 'exists',
      answer: { kind: 'boolean', value: true },
    })
  })

  it('defaults enableBehavior to any when a single condition has no explicit behavior', () => {
    expect(get(kitchenSinkItems, 'carMake').enableBehavior).toBe('any')
    expect(get(kitchenSinkItems, 'notes').enableBehavior).toBe('any')
    expect(get(kitchenSinkItems, 'anyContact').enableBehavior).toBe('any')
  })

  it('keeps an explicit enableBehavior all on adultCarOwner with 2 conditions', () => {
    const adultCarOwner = get(kitchenSinkItems, 'adultCarOwner')

    expect(adultCarOwner.enableBehavior).toBe('all')
    expect(adultCarOwner.enableWhen).toHaveLength(2)
  })

  it('keeps an explicit enableBehavior any on engagedUser with 2 conditions', () => {
    const engagedUser = get(kitchenSinkItems, 'engagedUser')

    expect(engagedUser.enableBehavior).toBe('any')
    expect(engagedUser.enableWhen).toHaveLength(2)
  })

  it('resolves the questionnaire-hidden extension on internalRef', () => {
    expect(get(kitchenSinkItems, 'internalRef').hidden).toBe(true)
  })

  it('degrades the unsupported time item to a display placeholder with rawType', () => {
    const appointmentTime = get(kitchenSinkItems, 'appointmentTime')

    expect(appointmentTime.unsupported).toBe(true)
    expect(appointmentTime.rawType).toBe('time')
    expect(appointmentTime.type).toBe('display')
  })
})
