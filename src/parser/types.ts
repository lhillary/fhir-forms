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

export type ItemControl =
  'radio-button' | 'check-box' | 'drop-down' | 'slider' | 'autocomplete'

export type EnableWhenOperator = 'exists' | '=' | '!=' | '>' | '<' | '>=' | '<='

export interface NormalizedAnswerOption {
  code: string // system|code for coding, or the literal value
  display: string
  weight?: number // resolved ordinalValue (R4) / itemWeight (R5)
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

// enableWhen pre-typed by operator + a discriminated answer so the engine
// evaluates without re-parsing FHIR answer[x] shapes.
export type EnableWhenAnswer =
  | { kind: 'boolean'; value: boolean }
  | { kind: 'integer'; value: number }
  | { kind: 'decimal'; value: number }
  | { kind: 'date'; value: string }
  | { kind: 'string'; value: string }
  | { kind: 'coding'; system?: string; code: string; display?: string }

export interface NormalizedEnableWhen {
  question: string
  operator: EnableWhenOperator
  answer: EnableWhenAnswer
}

export interface NormalizedUnit {
  code: string
  system?: string
  display?: string
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
  rawType?: string // original FHIR type when unsupported (e.g. 'time'); else omitted
  text?: string
  helpText?: string
  required: boolean
  repeats: boolean
  readOnly: boolean
  hidden: boolean
  unsupported?: boolean // renderer keys off this, not `type` (unsupported items get type 'display')
  control?: ItemControl
  options?: NormalizedAnswerOption[]
  unit?: NormalizedUnit // questionnaire-unit extension
  constraints: NormalizedConstraints
  slider?: NormalizedSlider
  enableWhen?: NormalizedEnableWhen[]
  enableBehavior: 'any' | 'all' // defaults to 'any' when absent
  children: NormalizedItem[]
}
