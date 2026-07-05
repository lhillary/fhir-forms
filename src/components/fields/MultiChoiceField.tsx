import type { ReactElement } from 'react'
import {
  Checkbox,
  CheckboxGroup,
  FieldError,
  Label,
  Text,
} from 'react-aria-components'
import { useFormStore, useVisibleErrors } from '../../store/useFormStore'
import { choiceRowClass, errorClass, helpClass, labelClass } from '../styles'
import {
  answerKey,
  answerList,
  errorText,
  optionToAnswer,
  type FieldProps,
} from './fieldHelpers'
import { CheckIndicator } from './indicators'

export function MultiChoiceField({ item }: FieldProps): ReactElement {
  const value = useFormStore((state) => state.answers[item.linkId])
  const setAnswer = useFormStore((state) => state.setAnswer)
  const markTouched = useFormStore((state) => state.markTouched)
  const errors = useVisibleErrors(item.linkId)

  const selected = answerList(value)
    .map(answerKey)
    .filter((key): key is string => key !== null)

  const onChange = (keys: string[]): void => {
    const answers = keys.flatMap((key) => {
      const option = item.options?.find((candidate) => candidate.code === key)
      return option !== undefined ? [optionToAnswer(option)] : []
    })
    setAnswer(item.linkId, answers)
  }

  return (
    <CheckboxGroup
      value={selected}
      onChange={onChange}
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
        {(item.options ?? []).map((option) => (
          <Checkbox
            key={option.code}
            value={option.code}
            className={choiceRowClass}
          >
            <CheckIndicator />
            {option.display}
          </Checkbox>
        ))}
      </div>
      <FieldError className={errorClass}>{errorText(errors)}</FieldError>
    </CheckboxGroup>
  )
}
