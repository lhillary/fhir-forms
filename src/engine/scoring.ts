import { evaluate } from 'fhirpath'
import * as r4Model from 'fhirpath/fhir-context/r4'
import type {
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireItemAnswerOption,
} from 'fhir/r4'
import type { NormalizedAnswerOption, NormalizedItem } from '../parser/types'
import { computeEnabledSet } from './enableWhen'
import { toQuestionnaireResponse } from './qr'
import type { AnswerMap, AnswerValue } from './types'

export interface ScoreResult {
  total: number
  byGroup?: Record<string, number>
}

const ORDINAL_VALUE_URL = 'http://hl7.org/fhir/StructureDefinition/ordinalValue'

// The namespace import widens the optional `score` field to possibly-undefined,
// which exactOptionalPropertyTypes rejects against the library's own Model type
type FhirModel = NonNullable<Parameters<typeof evaluate>[3]>
const R4_MODEL = r4Model as FhirModel

function toList(value: AnswerValue | AnswerValue[] | undefined): AnswerValue[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function isScorable(item: NormalizedItem): boolean {
  return item.options?.some((option) => option.weight !== undefined) ?? false
}

function toAnswerOption(
  option: NormalizedAnswerOption,
): QuestionnaireItemAnswerOption {
  const result: QuestionnaireItemAnswerOption = {}
  switch (option.valueType) {
    case 'coding': {
      const separator = option.code.indexOf('|')
      result.valueCoding =
        separator === -1
          ? { code: option.code }
          : {
              system: option.code.slice(0, separator),
              code: option.code.slice(separator + 1),
            }
      break
    }
    case 'string':
      result.valueString = option.code
      break
    case 'integer':
      result.valueInteger = Number(option.code)
      break
    case 'date':
      result.valueDate = option.code
      break
  }
  if (option.weight !== undefined) {
    result.extension = [{ url: ORDINAL_VALUE_URL, valueDecimal: option.weight }]
  }
  return result
}

// weight() resolves each QR answer's score from the matching answerOption's
// ordinalValue extension in %questionnaire, so a Questionnaire mirroring the
// normalized tree (same linkId nesting as the QR) is synthesized here — the
// engine never reads the raw source Questionnaire.
function toQuestionnaireItem(item: NormalizedItem): QuestionnaireItem {
  const result: QuestionnaireItem = {
    linkId: item.linkId,
    type: item.type,
  }
  if (item.options !== undefined) {
    result.answerOption = item.options.map(toAnswerOption)
  }
  if (item.children.length > 0) {
    result.item = item.children.map(toQuestionnaireItem)
  }
  return result
}

// FALLBACK: used when a fhirpath weight() evaluation can't resolve — e.g. a
// selected option carries no ordinalValue extension and no contained
// CodeSystem, which makes weight() attempt an async terminology lookup and
// throw in synchronous mode. Sums option.weight for the selected answers
// directly instead.
function fallbackScore(item: NormalizedItem, answers: AnswerMap): number {
  const options = item.options ?? []
  return toList(answers[item.linkId]).reduce((sum, answer) => {
    const key = optionKey(answer)
    const weight = options.find((option) => option.code === key)?.weight ?? 0
    return sum + weight
  }, 0)
}

function optionKey(answer: AnswerValue): string | undefined {
  switch (answer.type) {
    case 'coding':
      return answer.system !== undefined
        ? `${answer.system}|${answer.code}`
        : answer.code
    case 'string':
      return answer.value
    case 'integer':
      return String(answer.value)
    case 'date':
      return answer.value
    default:
      return undefined
  }
}

// Only enabled, non-hidden items contribute. Unscored options contribute 0.
// byGroup keys every group that contains at least one scorable enabled item
// and is omitted for flat questionnaires.
export function computeScore(
  items: NormalizedItem[],
  answers: AnswerMap,
): ScoreResult {
  const enabled = computeEnabledSet(items, answers)
  const questionnaire: Questionnaire = {
    resourceType: 'Questionnaire',
    status: 'active',
    item: items.map(toQuestionnaireItem),
  }
  const qr = toQuestionnaireResponse(items, answers, questionnaire)

  const scoreOf = (item: NormalizedItem): number => {
    const linkId = item.linkId.replace(/'/g, "\\'")
    const expression = `QuestionnaireResponse.repeat(item).where(linkId = '${linkId}').answer.weight().sum()`
    try {
      const [sum] = evaluate(qr, expression, { questionnaire }, R4_MODEL) as [
        unknown,
      ]
      return typeof sum === 'number' ? sum : 0
    } catch {
      return fallbackScore(item, answers)
    }
  }

  let total = 0
  const byGroup: Record<string, number> = {}
  const visit = (list: NormalizedItem[], groups: string[]): void => {
    for (const item of list) {
      if (item.hidden || !enabled.has(item.linkId)) continue
      if (item.type === 'group') {
        visit(item.children, [...groups, item.linkId])
        continue
      }
      if (!isScorable(item)) continue

      const score = scoreOf(item)
      total += score
      for (const group of groups) byGroup[group] = (byGroup[group] ?? 0) + score
    }
  }
  visit(items, [])

  const result: ScoreResult = { total }
  if (Object.keys(byGroup).length > 0) result.byGroup = byGroup
  return result
}
