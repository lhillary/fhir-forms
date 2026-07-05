import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { Questionnaire, QuestionnaireResponse } from 'fhir/r4'
import type { NormalizedItem } from '../parser/types'
import type { AnswerMap, AnswerValue } from '../engine/types'
import { computeEnabledSet } from '../engine/enableWhen'
import { validateForm, type ValidationError } from '../engine/validation'
import { computeScore, type ScoreResult } from '../engine/scoring'
import { fromQuestionnaireResponse, toQuestionnaireResponse } from '../engine/qr'

export interface DerivedState {
  enabledSet: Set<string>
  errors: Record<string, ValidationError[]>
  score: ScoreResult
}

export interface FormState {
  answers: AnswerMap
  touched: Record<string, boolean>
  submitAttempted: boolean
  derived: DerivedState

  hydrate: (items: NormalizedItem[]) => void
  setAnswer: (linkId: string, value: AnswerValue | AnswerValue[]) => void
  markTouched: (linkId: string) => void
  attemptSubmit: () => boolean
  reset: () => void
  loadFromQR: (qr: QuestionnaireResponse) => void
}

// The parsed tree is static input, not reactive state — held here so `answers`
// stays a flat map and recompute() can reach the tree without storing it.
let tree: NormalizedItem[] = []

// toQuestionnaireResponse only reads `.url` from its Questionnaire argument;
// hydrate() receives the normalized tree, not the raw resource, so exports
// carry no questionnaire reference.
const EXPORT_QUESTIONNAIRE: Questionnaire = {
  resourceType: 'Questionnaire',
  status: 'active',
}

function recompute(answers: AnswerMap): DerivedState {
  const enabledSet = computeEnabledSet(tree, answers)
  const errors: Record<string, ValidationError[]> = {}
  for (const error of validateForm(tree, answers, enabledSet)) {
    const list = errors[error.linkId] ?? []
    list.push(error)
    errors[error.linkId] = list
  }
  return { enabledSet, errors, score: computeScore(tree, answers) }
}

const emptyState: Pick<FormState, 'answers' | 'touched' | 'submitAttempted'> = {
  answers: {},
  touched: {},
  submitAttempted: false,
}

export const useFormStore = create<FormState>((set, get) => ({
  ...emptyState,
  derived: { enabledSet: new Set(), errors: {}, score: { total: 0 } },

  hydrate: (items) => {
    tree = items
    set({ ...emptyState, derived: recompute({}) })
  },
  setAnswer: (linkId, value) =>
    set((state) => {
      const answers = { ...state.answers, [linkId]: value }
      return { answers, derived: recompute(answers) }
    }),
  markTouched: (linkId) =>
    set((state) => ({ touched: { ...state.touched, [linkId]: true } })),
  attemptSubmit: () => {
    set((state) => ({ submitAttempted: true, derived: recompute(state.answers) }))
    return Object.keys(get().derived.errors).length === 0
  },
  reset: () => set({ ...emptyState, derived: recompute({}) }),
  loadFromQR: (qr) => {
    const answers = fromQuestionnaireResponse(qr, tree)
    set({ ...emptyState, answers, derived: recompute(answers) })
  },
}))

const NO_ERRORS: ValidationError[] = []

// Plain selectors so tests can drive the store via getState() without React;
// the exported hooks below are thin wrappers over these.
export function selectIsEnabled(state: FormState, linkId: string): boolean {
  return state.derived.enabledSet.has(linkId)
}

export function selectVisibleErrors(state: FormState, linkId: string): ValidationError[] {
  const visible = state.touched[linkId] === true || state.submitAttempted
  return visible ? (state.derived.errors[linkId] ?? NO_ERRORS) : NO_ERRORS
}

export function selectErrorSummary(state: FormState): { linkId: string; message: string }[] {
  // derived.errors already covers only enabled, non-hidden items
  return state.submitAttempted ? Object.values(state.derived.errors).flat() : NO_ERRORS
}

export function selectExportQR(state: FormState): QuestionnaireResponse {
  return toQuestionnaireResponse(tree, state.answers, EXPORT_QUESTIONNAIRE)
}

export function useIsEnabled(linkId: string): boolean {
  return useFormStore((state) => selectIsEnabled(state, linkId))
}

export function useVisibleErrors(linkId: string): ValidationError[] {
  return useFormStore(useShallow((state) => selectVisibleErrors(state, linkId)))
}

export function useErrorSummary(): { linkId: string; message: string }[] {
  return useFormStore(useShallow(selectErrorSummary))
}

export function useScore(): ScoreResult {
  return useFormStore(useShallow((state) => state.derived.score))
}

export function useExportQR(): QuestionnaireResponse {
  const answers = useFormStore((state) => state.answers)
  return toQuestionnaireResponse(tree, answers, EXPORT_QUESTIONNAIRE)
}
