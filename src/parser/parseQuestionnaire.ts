import type {
  Extension,
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireItemAnswerOption,
  QuestionnaireItemEnableWhen,
} from 'fhir/r4'
import type {
  ControlType,
  EnableWhenAnswer,
  EnableWhenOperator,
  ItemControl,
  NormalizedAnswerOption,
  NormalizedConstraints,
  NormalizedEnableWhen,
  NormalizedItem,
} from './types'

const EXT = {
  itemControl:
    'http://hl7.org/fhir/StructureDefinition/questionnaire-item-control',
  hidden: 'http://hl7.org/fhir/StructureDefinition/questionnaire-hidden',
  ordinalValue: 'http://hl7.org/fhir/StructureDefinition/ordinalValue',
  itemWeight: 'http://hl7.org/fhir/StructureDefinition/itemWeight',
  minValue: 'http://hl7.org/fhir/StructureDefinition/minValue',
  maxValue: 'http://hl7.org/fhir/StructureDefinition/maxValue',
  sliderStep:
    'http://hl7.org/fhir/StructureDefinition/questionnaire-sliderStepValue',
  regex: 'http://hl7.org/fhir/StructureDefinition/regex',
  entryFormat: 'http://hl7.org/fhir/StructureDefinition/entryFormat',
  unit: 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit',
} as const

const SUPPORTED_TYPES: readonly string[] = [
  'group',
  'display',
  'boolean',
  'string',
  'text',
  'integer',
  'decimal',
  'date',
  'choice',
  'open-choice',
  'quantity',
]

const SUPPORTED_CONTROLS: readonly string[] = [
  'radio-button',
  'check-box',
  'drop-down',
  'slider',
  'autocomplete',
]

const OPERATORS: readonly string[] = ['exists', '=', '!=', '>', '<', '>=', '<=']

function findExtension(
  extensions: Extension[] | undefined,
  url: string,
): Extension | undefined {
  return extensions?.find((extension) => extension.url === url)
}

function readNumber(extension: Extension | undefined): number | undefined {
  return extension?.valueDecimal ?? extension?.valueInteger
}

// itemControl codes are matched regardless of code system (fixtures use
// hl7.org/fhir/questionnaire-item-control; terminology.hl7.org appears in the wild).
function readItemControlCodes(extensions: Extension[] | undefined): string[] {
  const codings =
    findExtension(extensions, EXT.itemControl)?.valueCodeableConcept?.coding ??
    []
  return codings.flatMap((coding) =>
    coding.code !== undefined ? [coding.code] : [],
  )
}

function isHelpItem(item: QuestionnaireItem): boolean {
  return (
    item.type === 'display' &&
    readItemControlCodes(item.extension).includes('help')
  )
}

function parseOption(
  option: QuestionnaireItemAnswerOption,
): NormalizedAnswerOption | undefined {
  const weightExtension =
    findExtension(option.extension, EXT.ordinalValue) ??
    findExtension(option.extension, EXT.itemWeight)
  const weight = readNumber(weightExtension)

  let normalized: NormalizedAnswerOption | undefined
  if (option.valueCoding?.code !== undefined) {
    const { system, code, display } = option.valueCoding
    normalized = {
      code: system !== undefined ? `${system}|${code}` : code,
      display: display ?? code,
      valueType: 'coding',
    }
  } else if (option.valueString !== undefined) {
    normalized = {
      code: option.valueString,
      display: option.valueString,
      valueType: 'string',
    }
  } else if (option.valueInteger !== undefined) {
    const text = String(option.valueInteger)
    normalized = { code: text, display: text, valueType: 'integer' }
  } else if (option.valueDate !== undefined) {
    normalized = {
      code: option.valueDate,
      display: option.valueDate,
      valueType: 'date',
    }
  }

  if (normalized && weight !== undefined) normalized.weight = weight
  return normalized
}

function parseEnableWhen(
  condition: QuestionnaireItemEnableWhen,
): NormalizedEnableWhen | undefined {
  if (
    typeof condition.question !== 'string' ||
    !OPERATORS.includes(condition.operator)
  ) {
    return undefined
  }

  let answer: EnableWhenAnswer | undefined
  if (condition.answerBoolean !== undefined) {
    answer = { kind: 'boolean', value: condition.answerBoolean }
  } else if (condition.answerInteger !== undefined) {
    answer = { kind: 'integer', value: condition.answerInteger }
  } else if (condition.answerDecimal !== undefined) {
    answer = { kind: 'decimal', value: condition.answerDecimal }
  } else if (condition.answerDate !== undefined) {
    answer = { kind: 'date', value: condition.answerDate }
  } else if (condition.answerString !== undefined) {
    answer = { kind: 'string', value: condition.answerString }
  } else if (condition.answerCoding?.code !== undefined) {
    answer = { kind: 'coding', code: condition.answerCoding.code }
    if (condition.answerCoding.system !== undefined)
      answer.system = condition.answerCoding.system
    if (condition.answerCoding.display !== undefined) {
      answer.display = condition.answerCoding.display
    }
  }
  if (!answer) return undefined

  return {
    question: condition.question,
    operator: condition.operator as EnableWhenOperator,
    answer,
  }
}

function parseConstraints(item: QuestionnaireItem): NormalizedConstraints {
  const constraints: NormalizedConstraints = {}
  if (item.maxLength !== undefined) constraints.maxLength = item.maxLength

  // regex wins; entryFormat is only a fallback pattern source when no regex is given
  const regex =
    findExtension(item.extension, EXT.regex)?.valueString ??
    findExtension(item.extension, EXT.entryFormat)?.valueString
  if (regex !== undefined) constraints.regex = regex

  const minExtension = findExtension(item.extension, EXT.minValue)
  const maxExtension = findExtension(item.extension, EXT.maxValue)
  const minValue = readNumber(minExtension)
  const maxValue = readNumber(maxExtension)
  if (minValue !== undefined) constraints.minValue = minValue
  if (maxValue !== undefined) constraints.maxValue = maxValue
  if (minExtension?.valueDate !== undefined)
    constraints.minDate = minExtension.valueDate
  if (maxExtension?.valueDate !== undefined)
    constraints.maxDate = maxExtension.valueDate

  return constraints
}

function parseItem(item: QuestionnaireItem): NormalizedItem {
  const helpTexts: string[] = []
  const children: NormalizedItem[] = []
  for (const child of item.item ?? []) {
    if (child === null || typeof child !== 'object') continue
    if (isHelpItem(child)) {
      if (child.text !== undefined) helpTexts.push(child.text)
      continue
    }
    children.push(parseItem(child))
  }

  const supported =
    typeof item.type === 'string' && SUPPORTED_TYPES.includes(item.type)
  const normalized: NormalizedItem = {
    linkId: item.linkId ?? '',
    type: supported ? (item.type as ControlType) : 'display',
    required: item.required ?? false,
    repeats: item.repeats ?? false,
    readOnly: item.readOnly ?? false,
    hidden: findExtension(item.extension, EXT.hidden)?.valueBoolean === true,
    constraints: parseConstraints(item),
    enableBehavior: item.enableBehavior === 'all' ? 'all' : 'any',
    children,
  }
  if (!supported) {
    normalized.unsupported = true
    normalized.rawType = typeof item.type === 'string' ? item.type : 'unknown'
  }
  if (item.text !== undefined) normalized.text = item.text
  if (helpTexts.length > 0) normalized.helpText = helpTexts.join('\n')

  const controlCode = readItemControlCodes(item.extension).find((code) =>
    SUPPORTED_CONTROLS.includes(code),
  )
  if (controlCode !== undefined) normalized.control = controlCode as ItemControl

  const options = (item.answerOption ?? [])
    .map(parseOption)
    .filter((option): option is NormalizedAnswerOption => option !== undefined)
  if (options.length > 0) normalized.options = options

  const unitCoding = findExtension(item.extension, EXT.unit)?.valueCoding
  if (unitCoding?.code !== undefined) {
    normalized.unit = { code: unitCoding.code }
    if (unitCoding.system !== undefined)
      normalized.unit.system = unitCoding.system
    if (unitCoding.display !== undefined)
      normalized.unit.display = unitCoding.display
  }

  if (normalized.control === 'slider') {
    normalized.slider = {
      min: normalized.constraints.minValue ?? 0,
      max: normalized.constraints.maxValue ?? 100,
      step: readNumber(findExtension(item.extension, EXT.sliderStep)) ?? 1,
    }
  }

  const conditions = (item.enableWhen ?? [])
    .map(parseEnableWhen)
    .filter(
      (condition): condition is NormalizedEnableWhen => condition !== undefined,
    )
  if (conditions.length > 0) normalized.enableWhen = conditions

  return normalized
}

export function parseQuestionnaire(
  questionnaire: Questionnaire,
): NormalizedItem[] {
  return (questionnaire.item ?? [])
    .filter(
      (item): item is QuestionnaireItem =>
        item !== null && typeof item === 'object',
    )
    .map(parseItem)
}
