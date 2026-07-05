import type { ReactElement } from 'react'
import {
  FieldError,
  Input,
  Label,
  Text,
  TextArea,
  TextField,
} from 'react-aria-components'
import { useFormStore, useVisibleErrors } from '../../store/useFormStore'
import { errorClass, helpClass, inputClass, labelClass } from '../styles'
import { errorText, singleAnswer, type FieldProps } from './fieldHelpers'

export function TextInputField({ item }: FieldProps): ReactElement {
  const value = useFormStore((state) => state.answers[item.linkId])
  const setAnswer = useFormStore((state) => state.setAnswer)
  const markTouched = useFormStore((state) => state.markTouched)
  const errors = useVisibleErrors(item.linkId)

  const answer = singleAnswer(value)
  const text = answer?.type === 'string' ? answer.value : ''

  return (
    <TextField
      value={text}
      onChange={(next) =>
        setAnswer(item.linkId, { type: 'string', value: next })
      }
      onBlur={() => markTouched(item.linkId)}
      isRequired={item.required}
      isInvalid={errors.length > 0}
      className="flex max-w-md flex-col gap-1"
    >
      <Label className={labelClass}>{item.text ?? item.linkId}</Label>
      {item.helpText !== undefined && (
        <Text slot="description" className={helpClass}>
          {item.helpText}
        </Text>
      )}
      {item.type === 'text' ? (
        <TextArea rows={3} className={inputClass} />
      ) : (
        <Input className={inputClass} />
      )}
      <FieldError className={errorClass}>{errorText(errors)}</FieldError>
    </TextField>
  )
}
