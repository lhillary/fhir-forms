import { create } from 'zustand'
import type { QuestionnaireResponse } from 'fhir/r4'
import type { AnswerValue } from '../parser/types'
import { fromQuestionnaireResponse } from '../engine/qr'

export interface FormState {
  answers: Record<string, AnswerValue | AnswerValue[]>
  touched: Record<string, boolean>
  submitAttempted: boolean

  setAnswer: (linkId: string, value: AnswerValue | AnswerValue[]) => void
  markTouched: (linkId: string) => void
  attemptSubmit: () => void
  reset: () => void
  loadFromQR: (qr: QuestionnaireResponse) => void
}

const emptyState: Pick<FormState, 'answers' | 'touched' | 'submitAttempted'> = {
  answers: {},
  touched: {},
  submitAttempted: false,
}

export const useFormStore = create<FormState>((set) => ({
  ...emptyState,

  setAnswer: (linkId, value) =>
    set((state) => ({ answers: { ...state.answers, [linkId]: value } })),
  markTouched: (linkId) => set((state) => ({ touched: { ...state.touched, [linkId]: true } })),
  attemptSubmit: () => set({ submitAttempted: true }),
  reset: () => set(emptyState),
  loadFromQR: (qr) => set({ answers: fromQuestionnaireResponse(qr, []), touched: {} }),
}))
