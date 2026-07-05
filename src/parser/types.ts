// The normalized, render-ready shape. Everything downstream (engine, store,
// components) depends only on these types — never on raw fhir4.* again.

export type ControlType =
  | 'group'
  | 'display'
  | 'boolean'
  | 'string'
  | 'text'
  | 'integer'
  | 'decimal'
  | 'date'
  | 'choice'
  | 'open-choice'
  | 'quantity'

export type ItemControl = 'radio-button' | 'check-box' | 'drop-down' | 'slider' | 'autocomplete'

export type EnableWhenOperator = 'exists' | '=' | '!=' | '>' | '<' | '>=' | '<='

export interface NormalizedAnswerOption {
  code: string
  display: string
  weight?: number
  valueType: 'coding' | 'string' | 'integer' | 'date'
}

// A resolved answer value, discriminated by type so the engine and store never
// have to re-inspect FHIR value[x] shapes.
export type AnswerValue =
  | { type: 'boolean'; value: boolean }
  | { type: 'string'; value: string }
  | { type: 'integer'; value: number }
  | { type: 'decimal'; value: number }
  | { type: 'date'; value: string }
  | { type: 'coding'; system?: string; code: string; display?: string }
  | { type: 'quantity'; value: number; unit?: string }

export type AnswerMap = Record<string, AnswerValue | AnswerValue[]>

// enableWhen kept FHIR-shaped but pre-typed by operator + answer value so the
// engine evaluates without re-parsing.
export interface NormalizedEnableWhen {
  question: string
  operator: EnableWhenOperator
  value: AnswerValue
}

export interface NormalizedConstraints {
  maxLength?: number
  regex?: string
  minValue?: number
  maxValue?: number
  minDate?: string
  maxDate?: string
}

export interface NormalizedSlider {
  min: number
  max: number
  step: number
}

export interface NormalizedItem {
  linkId: string
  type: ControlType
  text?: string
  helpText?: string
  required: boolean
  repeats: boolean
  readOnly: boolean
  hidden: boolean
  unsupported?: boolean
  control?: ItemControl
  options?: NormalizedAnswerOption[]
  constraints: NormalizedConstraints
  slider?: NormalizedSlider
  enableWhen?: NormalizedEnableWhen[]
  enableBehavior: 'any' | 'all'
  children: NormalizedItem[]
}
