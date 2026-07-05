import type {
  EnableWhenAnswer,
  NormalizedEnableWhen,
  NormalizedItem,
} from '../parser/types'
import type { AnswerMap, AnswerValue } from './types'

function toList(value: AnswerValue | AnswerValue[] | undefined): AnswerValue[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function numericOf(answer: AnswerValue): number | undefined {
  if (
    answer.type === 'integer' ||
    answer.type === 'decimal' ||
    answer.type === 'quantity'
  ) {
    return answer.value
  }
  return undefined
}

function matches(answer: AnswerValue, expected: EnableWhenAnswer): boolean {
  switch (expected.kind) {
    case 'boolean':
      return answer.type === 'boolean' && answer.value === expected.value
    case 'integer':
    case 'decimal':
      return numericOf(answer) === expected.value
    case 'date':
      return answer.type === 'date' && answer.value === expected.value
    case 'string':
      return answer.type === 'string' && answer.value === expected.value
    case 'coding':
      return (
        answer.type === 'coding' &&
        answer.code === expected.code &&
        (expected.system === undefined || answer.system === expected.system)
      )
  }
}

// Comparator result, or undefined when the pair isn't orderable — the spec-side
// choice here is that a comparison operator against a non-orderable answer
// makes the condition false rather than throwing.
function orderOf(
  answer: AnswerValue,
  expected: EnableWhenAnswer,
): number | undefined {
  if (expected.kind === 'integer' || expected.kind === 'decimal') {
    const value = numericOf(answer)
    return value === undefined ? undefined : value - expected.value
  }
  if (expected.kind === 'date' && answer.type === 'date') {
    // ISO-8601 dates order lexicographically
    if (answer.value < expected.value) return -1
    return answer.value > expected.value ? 1 : 0
  }
  return undefined
}

function conditionMet(
  condition: NormalizedEnableWhen,
  value: AnswerValue | AnswerValue[] | undefined,
): boolean {
  const values = toList(value)
  const { operator, answer: expected } = condition

  if (operator === 'exists') {
    const shouldExist = expected.kind === 'boolean' ? expected.value : true
    return values.length > 0 === shouldExist
  }
  if (values.length === 0) return false
  if (operator === '=') return values.some((v) => matches(v, expected))
  if (operator === '!=') return values.some((v) => !matches(v, expected))

  return values.some((v) => {
    const order = orderOf(v, expected)
    if (order === undefined) return false
    if (operator === '>') return order > 0
    if (operator === '<') return order < 0
    if (operator === '>=') return order >= 0
    return order <= 0
  })
}

function conditionsMet(
  item: NormalizedItem,
  answerFor: (question: string) => AnswerValue | AnswerValue[] | undefined,
): boolean {
  const conditions = item.enableWhen ?? []
  if (conditions.length === 0) return true

  const met = (condition: NormalizedEnableWhen): boolean =>
    conditionMet(condition, answerFor(condition.question))
  return item.enableBehavior === 'all'
    ? conditions.every(met)
    : conditions.some(met)
}

// Evaluates only this item's own enableWhen conditions against the answers as
// given. Parent-disables-child and "a disabled question's answer counts as
// unanswered" are whole-tree concerns handled by computeEnabledSet.
export function isItemEnabled(
  item: NormalizedItem,
  answers: AnswerMap,
): boolean {
  return conditionsMet(item, (question) => answers[question])
}

// Whole-tree evaluation (top-down): an item is enabled when its parent is
// enabled and its own conditions pass, where a referenced question that is
// itself disabled — or part of a reference cycle — contributes as unanswered.
export function computeEnabledSet(
  items: NormalizedItem[],
  answers: AnswerMap,
): Set<string> {
  const itemsById = new Map<string, NormalizedItem>()
  const parentOf = new Map<string, string>()
  const index = (list: NormalizedItem[], parent?: string): void => {
    for (const item of list) {
      itemsById.set(item.linkId, item)
      if (parent !== undefined) parentOf.set(item.linkId, parent)
      index(item.children, item.linkId)
    }
  }
  index(items)

  const memo = new Map<string, boolean>()
  const visiting = new Set<string>()

  const isEnabled = (linkId: string): boolean => {
    const cached = memo.get(linkId)
    if (cached !== undefined) return cached
    if (visiting.has(linkId)) return false

    const item = itemsById.get(linkId)
    if (item === undefined) return false

    visiting.add(linkId)
    const parent = parentOf.get(linkId)
    const enabled =
      (parent === undefined || isEnabled(parent)) &&
      conditionsMet(item, (question) =>
        isEnabled(question) ? answers[question] : undefined,
      )
    visiting.delete(linkId)

    memo.set(linkId, enabled)
    return enabled
  }

  const enabled = new Set<string>()
  for (const linkId of itemsById.keys()) {
    if (isEnabled(linkId)) enabled.add(linkId)
  }
  return enabled
}
