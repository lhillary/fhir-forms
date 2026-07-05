import type {
  AnswerValue,
  NormalizedAnswerOption,
  NormalizedItem,
} from '../../parser/types'

export interface FieldProps {
  item: NormalizedItem
}

// Error messages arrive from store selectors; typed structurally so this layer
// never imports engine modules.
export interface FieldMessage {
  message: string
}

export interface ChoiceProps {
  item: NormalizedItem
  selectedKey: string | null
  errors: readonly FieldMessage[]
  onSelect: (key: string | null) => void
  onBlur: () => void
}

export function fieldId(linkId: string): string {
  return `field-${linkId}`
}

export function errorText(errors: readonly FieldMessage[]): string {
  return errors.map((error) => error.message).join('. ')
}

export function describedBy(
  ids: readonly (string | false | undefined)[],
): string | undefined {
  const joined = ids
    .filter((id): id is string => typeof id === 'string')
    .join(' ')
  return joined === '' ? undefined : joined
}

export function singleAnswer(
  value: AnswerValue | AnswerValue[] | undefined,
): AnswerValue | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function answerList(
  value: AnswerValue | AnswerValue[] | undefined,
): AnswerValue[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

// Options carry `system|code` keys for codings; rebuild the discriminated
// AnswerValue the store and engine expect.
export function optionToAnswer(option: NormalizedAnswerOption): AnswerValue {
  switch (option.valueType) {
    case 'coding': {
      const separator = option.code.indexOf('|')
      if (separator === -1) {
        return { type: 'coding', code: option.code, display: option.display }
      }
      return {
        type: 'coding',
        system: option.code.slice(0, separator),
        code: option.code.slice(separator + 1),
        display: option.display,
      }
    }
    case 'string':
      return { type: 'string', value: option.code }
    case 'integer':
      return { type: 'integer', value: Number(option.code) }
    case 'date':
      return { type: 'date', value: option.code }
  }
}

export function answerKey(answer: AnswerValue | undefined): string | null {
  if (answer === undefined) return null
  switch (answer.type) {
    case 'coding':
      return answer.system !== undefined
        ? `${answer.system}|${answer.code}`
        : answer.code
    case 'string':
    case 'date':
      return answer.value
    case 'integer':
    case 'decimal':
      return String(answer.value)
    default:
      return null
  }
}
