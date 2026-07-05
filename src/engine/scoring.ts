import type { AnswerMap, NormalizedItem } from '../parser/types'

export interface ScoreResult {
  total: number
  byGroup?: Record<string, number>
}

// Stub: FHIRPath weight()-based scoring will come later
export function computeScore(_items: NormalizedItem[], _answers: AnswerMap): ScoreResult {
  return { total: 0 }
}
