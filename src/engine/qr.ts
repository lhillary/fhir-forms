import type {
  Questionnaire,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer,
} from 'fhir/r4'
import type { NormalizedItem } from '../parser/types'
import { computeEnabledSet } from './enableWhen'
import type { AnswerMap, AnswerValue } from './types'

function toList(value: AnswerValue | AnswerValue[] | undefined): AnswerValue[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function toResponseAnswer(value: AnswerValue): QuestionnaireResponseItemAnswer {
  switch (value.type) {
    case 'boolean':
      return { valueBoolean: value.value }
    case 'string':
      return { valueString: value.value }
    case 'integer':
      return { valueInteger: value.value }
    case 'decimal':
      return { valueDecimal: value.value }
    case 'date':
      return { valueDate: value.value }
    case 'coding':
      return {
        valueCoding: {
          code: value.code,
          ...(value.system !== undefined ? { system: value.system } : {}),
          ...(value.display !== undefined ? { display: value.display } : {}),
        },
      }
    case 'quantity':
      return {
        valueQuantity: {
          value: value.value,
          ...(value.unit !== undefined ? { unit: value.unit } : {}),
        },
      }
  }
}

function fromResponseAnswer(
  answer: QuestionnaireResponseItemAnswer,
): AnswerValue | undefined {
  if (answer.valueBoolean !== undefined) {
    return { type: 'boolean', value: answer.valueBoolean }
  }
  if (answer.valueDecimal !== undefined) {
    return { type: 'decimal', value: answer.valueDecimal }
  }
  if (answer.valueInteger !== undefined) {
    return { type: 'integer', value: answer.valueInteger }
  }
  if (answer.valueDate !== undefined) {
    return { type: 'date', value: answer.valueDate }
  }
  if (answer.valueString !== undefined) {
    return { type: 'string', value: answer.valueString }
  }
  if (answer.valueCoding?.code !== undefined) {
    const { system, code, display } = answer.valueCoding
    return {
      type: 'coding',
      code,
      ...(system !== undefined ? { system } : {}),
      ...(display !== undefined ? { display } : {}),
    }
  }
  if (answer.valueQuantity?.value !== undefined) {
    const { value, unit } = answer.valueQuantity
    return { type: 'quantity', value, ...(unit !== undefined ? { unit } : {}) }
  }
  return undefined
}

function buildItems(
  items: NormalizedItem[],
  answers: AnswerMap,
  enabled: ReadonlySet<string>,
): QuestionnaireResponseItem[] {
  const result: QuestionnaireResponseItem[] = []
  for (const item of items) {
    if (item.hidden || !enabled.has(item.linkId) || item.type === 'display') {
      continue
    }

    const node: QuestionnaireResponseItem = { linkId: item.linkId }
    if (item.text !== undefined) node.text = item.text

    if (item.type !== 'group') {
      const answerList = toList(answers[item.linkId]).map(toResponseAnswer)
      if (answerList.length > 0) node.answer = answerList
    }
    const children = buildItems(item.children, answers, enabled)
    if (children.length > 0) node.item = children

    if (node.answer !== undefined || node.item !== undefined) result.push(node)
  }
  return result
}

// Disabled and hidden items are excluded; group nesting is preserved as QR
// item nesting (children of question items also nest under `item`, not under
// `answer`). Deterministic — no authored timestamp is stamped here.
export function toQuestionnaireResponse(
  items: NormalizedItem[],
  answers: AnswerMap,
  questionnaire: Questionnaire,
): QuestionnaireResponse {
  const qr: QuestionnaireResponse = {
    resourceType: 'QuestionnaireResponse',
    status: 'completed',
  }
  if (questionnaire.url !== undefined) qr.questionnaire = questionnaire.url

  const item = buildItems(items, answers, computeEnabledSet(items, answers))
  if (item.length > 0) qr.item = item
  return qr
}

export function fromQuestionnaireResponse(
  qr: QuestionnaireResponse,
  items: NormalizedItem[],
): AnswerMap {
  const repeatsById = new Map<string, boolean>()
  const index = (list: NormalizedItem[]): void => {
    for (const item of list) {
      repeatsById.set(item.linkId, item.repeats)
      index(item.children)
    }
  }
  index(items)

  const answers: AnswerMap = {}
  const visit = (list: QuestionnaireResponseItem[] | undefined): void => {
    for (const node of list ?? []) {
      const values = (node.answer ?? []).flatMap((answer) => {
        const value = fromResponseAnswer(answer)
        return value === undefined ? [] : [value]
      })
      const first = values[0]
      if (first !== undefined) {
        const repeats = repeatsById.get(node.linkId) ?? values.length > 1
        answers[node.linkId] = repeats ? values : first
      }

      // We nest children under `item`, but imported QRs may nest under answers
      visit(node.item)
      for (const answer of node.answer ?? []) visit(answer.item)
    }
  }
  visit(qr.item)
  return answers
}
