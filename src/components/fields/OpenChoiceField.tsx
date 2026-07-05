import { useState, type ReactElement } from 'react'
import {
  FieldError,
  Input,
  Label,
  Radio,
  RadioGroup,
  Text,
  TextField,
} from 'react-aria-components'
import { useFormStore, useVisibleErrors } from '../../store/useFormStore'
import {
  choiceRowClass,
  errorClass,
  helpClass,
  inputClass,
  labelClass,
} from '../styles'
import {
  answerKey,
  errorText,
  optionToAnswer,
  singleAnswer,
  type FieldProps,
} from './fieldHelpers'
import { RadioIndicator } from './indicators'

const OTHER_KEY = '__other__'

export function OpenChoiceField({ item }: FieldProps): ReactElement {
  const value = useFormStore((state) => state.answers[item.linkId])
  const setAnswer = useFormStore((state) => state.setAnswer)
  const markTouched = useFormStore((state) => state.markTouched)
  const errors = useVisibleErrors(item.linkId)

  const answer = singleAnswer(value)
  const options = item.options ?? []
  const key = answerKey(answer)
  const matchedKey =
    key !== null && options.some((option) => option.code === key) ? key : null
  // A free-text answer (typed or imported from a QR) never matches an option key
  const isOtherAnswer =
    answer !== undefined && answer.type === 'string' && matchedKey === null

  const [otherChosen, setOtherChosen] = useState(isOtherAnswer)
  const [draft, setDraft] = useState(isOtherAnswer ? answer.value : '')
  const otherText = isOtherAnswer ? answer.value : draft
  const radioValue =
    matchedKey ?? (isOtherAnswer || otherChosen ? OTHER_KEY : null)

  const onRadioChange = (next: string): void => {
    if (next === OTHER_KEY) {
      setOtherChosen(true)
      setAnswer(item.linkId, { type: 'string', value: otherText })
      return
    }
    setOtherChosen(false)
    const option = options.find((candidate) => candidate.code === next)
    setAnswer(item.linkId, option !== undefined ? optionToAnswer(option) : [])
  }

  const onOtherText = (next: string): void => {
    setDraft(next)
    setOtherChosen(true)
    setAnswer(item.linkId, { type: 'string', value: next })
  }

  return (
    <div className="flex flex-col gap-2">
      <RadioGroup
        value={radioValue}
        onChange={onRadioChange}
        onBlur={() => markTouched(item.linkId)}
        isRequired={item.required}
        isInvalid={errors.length > 0}
        className="flex flex-col gap-1"
      >
        <Label className={labelClass}>{item.text ?? item.linkId}</Label>
        {item.helpText !== undefined && (
          <Text slot="description" className={helpClass}>
            {item.helpText}
          </Text>
        )}
        <div className="flex flex-col">
          {options.map((option) => (
            <Radio
              key={option.code}
              value={option.code}
              className={choiceRowClass}
            >
              <RadioIndicator />
              {option.display}
            </Radio>
          ))}
          <Radio value={OTHER_KEY} className={choiceRowClass}>
            <RadioIndicator />
            Other
          </Radio>
        </div>
        <FieldError className={errorClass}>{errorText(errors)}</FieldError>
      </RadioGroup>
      <TextField
        value={otherText}
        onChange={onOtherText}
        onBlur={() => markTouched(item.linkId)}
        className="ml-7 flex max-w-md flex-col gap-1"
      >
        <Label className={helpClass}>Other — please specify</Label>
        <Input className={inputClass} />
      </TextField>
    </div>
  )
}
