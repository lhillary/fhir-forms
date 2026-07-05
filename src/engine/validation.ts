import type { AnswerValue, NormalizedItem } from '../parser/types'

export interface ValidationError {
  linkId: string
  code: string
  message: string
}

// Stub: required / maxLength / regex / min-max rules coming later
export function validateItem(
  _item: NormalizedItem,
  _value: AnswerValue | AnswerValue[] | undefined,
): ValidationError[] {
  return []
}
