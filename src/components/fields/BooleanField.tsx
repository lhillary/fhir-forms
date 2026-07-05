import type { ReactElement } from 'react'
import { Checkbox } from 'react-aria-components'
import { useFormStore, useVisibleErrors } from '../../store/useFormStore'
import { choiceRowClass, errorClass, helpClass } from '../styles'
import {
  describedBy,
  errorText,
  fieldId,
  singleAnswer,
  type FieldProps,
} from './fieldHelpers'
import { CheckIndicator } from './indicators'

export function BooleanField({ item }: FieldProps): ReactElement {
  const value = useFormStore((state) => state.answers[item.linkId])
  const setAnswer = useFormStore((state) => state.setAnswer)
  const markTouched = useFormStore((state) => state.markTouched)
  const errors = useVisibleErrors(item.linkId)

  const answer = singleAnswer(value)
  const isSelected = answer?.type === 'boolean' && answer.value
  const invalid = errors.length > 0
  const helpId = `${fieldId(item.linkId)}-help`
  const errorId = `${fieldId(item.linkId)}-error`
  const described = describedBy([
    item.helpText !== undefined && helpId,
    invalid && errorId,
  ])

  return (
    <div className="flex flex-col gap-1">
      <Checkbox
        isSelected={isSelected}
        onChange={(checked) =>
          setAnswer(item.linkId, { type: 'boolean', value: checked })
        }
        onBlur={() => markTouched(item.linkId)}
        isRequired={item.required}
        isInvalid={invalid}
        {...(described !== undefined ? { 'aria-describedby': described } : {})}
        className={choiceRowClass}
      >
        <CheckIndicator />
        {item.text ?? item.linkId}
      </Checkbox>
      {item.helpText !== undefined && (
        <p id={helpId} className={helpClass}>
          {item.helpText}
        </p>
      )}
      {invalid && (
        <p id={errorId} className={errorClass}>
          {errorText(errors)}
        </p>
      )}
    </div>
  )
}
