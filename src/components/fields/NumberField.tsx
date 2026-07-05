import type { ReactElement } from 'react'
import {
  FieldError,
  Group,
  Input,
  Label,
  NumberField as RacNumberField,
  Text,
} from 'react-aria-components'
import type { AnswerValue } from '../../parser/types'
import { useFormStore, useVisibleErrors } from '../../store/useFormStore'
import { errorClass, helpClass, inputClass, labelClass } from '../styles'
import { errorText, singleAnswer, type FieldProps } from './fieldHelpers'

function isNumeric(
  answer: AnswerValue | undefined,
): answer is Extract<
  AnswerValue,
  { type: 'integer' | 'decimal' | 'quantity' }
> {
  return (
    answer !== undefined &&
    (answer.type === 'integer' ||
      answer.type === 'decimal' ||
      answer.type === 'quantity')
  )
}

export function NumberField({ item }: FieldProps): ReactElement {
  const value = useFormStore((state) => state.answers[item.linkId])
  const setAnswer = useFormStore((state) => state.setAnswer)
  const markTouched = useFormStore((state) => state.markTouched)
  const errors = useVisibleErrors(item.linkId)

  const answer = singleAnswer(value)
  const current = isNumeric(answer) ? answer.value : NaN

  const toAnswer = (next: number): AnswerValue => {
    if (item.type === 'integer') return { type: 'integer', value: next }
    if (item.type === 'quantity') {
      const unit = item.unit?.display ?? item.unit?.code
      return unit !== undefined
        ? { type: 'quantity', value: next, unit }
        : { type: 'quantity', value: next }
    }
    return { type: 'decimal', value: next }
  }

  return (
    <RacNumberField
      value={current}
      onChange={(next) =>
        setAnswer(item.linkId, Number.isNaN(next) ? [] : toAnswer(next))
      }
      onBlur={() => markTouched(item.linkId)}
      isRequired={item.required}
      isInvalid={errors.length > 0}
      formatOptions={
        item.type === 'integer'
          ? { maximumFractionDigits: 0 }
          : { maximumFractionDigits: 4 }
      }
      className="flex max-w-md flex-col gap-1"
    >
      <Label className={labelClass}>{item.text ?? item.linkId}</Label>
      {item.helpText !== undefined && (
        <Text slot="description" className={helpClass}>
          {item.helpText}
        </Text>
      )}
      {item.unit?.display !== undefined && (
        <Text slot="description" className={helpClass}>
          Unit: {item.unit.display}
        </Text>
      )}
      <Group className="flex items-center gap-2">
        <Input className={inputClass} />
        {item.unit?.display !== undefined && (
          <span className="text-gray-700">{item.unit.display}</span>
        )}
      </Group>
      <FieldError className={errorClass}>{errorText(errors)}</FieldError>
    </RacNumberField>
  )
}
