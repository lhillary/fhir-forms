import type { NormalizedItem } from '../parser/types'
import { computeEnabledSet } from './enableWhen'
import type { AnswerMap, AnswerValue } from './types'

export interface ValidationError {
  linkId: string
  code: string
  message: string
}

function toList(value: AnswerValue | AnswerValue[] | undefined): AnswerValue[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function isEmpty(value: AnswerValue | AnswerValue[] | undefined): boolean {
  if (value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  return value.type === 'string' && value.value === ''
}

export function validateItem(
  item: NormalizedItem,
  value: AnswerValue | AnswerValue[] | undefined,
): ValidationError[] {
  if (item.type === 'group' || item.type === 'display') return []

  if (isEmpty(value)) {
    return item.required
      ? [
          {
            linkId: item.linkId,
            code: 'required',
            message: 'An answer is required',
          },
        ]
      : []
  }

  const errors: ValidationError[] = []
  const fail = (code: string, message: string): void => {
    errors.push({ linkId: item.linkId, code, message })
  }
  const { maxLength, regex, minValue, maxValue, minDate, maxDate } =
    item.constraints
  const pattern = regex !== undefined ? new RegExp(regex) : undefined

  for (const answer of toList(value)) {
    if (answer.type === 'string') {
      if (maxLength !== undefined && answer.value.length > maxLength) {
        fail('maxLength', `Must be ${maxLength} characters or fewer`)
      }
      if (
        pattern !== undefined &&
        answer.value !== '' &&
        !pattern.test(answer.value)
      ) {
        fail('pattern', 'Does not match the expected format')
      }
    }

    const numeric =
      answer.type === 'integer' ||
      answer.type === 'decimal' ||
      answer.type === 'quantity'
    if (numeric) {
      if (minValue !== undefined && answer.value < minValue) {
        fail('min', `Must be at least ${minValue}`)
      }
      if (maxValue !== undefined && answer.value > maxValue) {
        fail('max', `Must be at most ${maxValue}`)
      }
    }

    if (answer.type === 'date') {
      if (minDate !== undefined && answer.value < minDate) {
        fail('minDate', `Must be on or after ${minDate}`)
      }
      if (maxDate !== undefined && answer.value > maxDate) {
        fail('maxDate', `Must be on or before ${maxDate}`)
      }
    }
  }
  return errors
}

// Validates every visible, enabled item. Hidden items and disabled items (and
// everything beneath them) are skipped. Pass a precomputed enabledSet when the
// caller already derives one; otherwise it is computed here.
export function validateForm(
  items: NormalizedItem[],
  answers: AnswerMap,
  enabledSet?: ReadonlySet<string>,
): ValidationError[] {
  const enabled = enabledSet ?? computeEnabledSet(items, answers)
  const errors: ValidationError[] = []
  const visit = (list: NormalizedItem[]): void => {
    for (const item of list) {
      if (item.hidden || !enabled.has(item.linkId)) continue
      errors.push(...validateItem(item, answers[item.linkId]))
      visit(item.children)
    }
  }
  visit(items)
  return errors
}
