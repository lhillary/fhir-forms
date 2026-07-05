// AnswerValue / AnswerMap are the engine's input contract. Their canonical
// definitions live in parser/types.ts (the parser produces them); they are
// aliased here so engine modules and their consumers import them from the
// engine boundary.
export type { AnswerMap, AnswerValue } from '../parser/types'
