import type { ReactElement } from 'react'
import {
  Label,
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from 'react-aria-components'
import { useFormStore, useVisibleErrors } from '../../store/useFormStore'
import { errorClass, focusRing, helpClass, labelClass } from '../styles'
import {
  describedBy,
  errorText,
  fieldId,
  singleAnswer,
  type FieldProps,
} from './fieldHelpers'

export function SliderField({ item }: FieldProps): ReactElement {
  const value = useFormStore((state) => state.answers[item.linkId])
  const setAnswer = useFormStore((state) => state.setAnswer)
  const markTouched = useFormStore((state) => state.markTouched)
  const errors = useVisibleErrors(item.linkId)

  const slider = item.slider ?? { min: 0, max: 100, step: 1 }
  const answer = singleAnswer(value)
  const current = answer?.type === 'integer' ? answer.value : slider.min
  const invalid = errors.length > 0
  const helpId = `${fieldId(item.linkId)}-help`
  const errorId = `${fieldId(item.linkId)}-error`
  const described = describedBy([
    item.helpText !== undefined && helpId,
    invalid && errorId,
  ])

  return (
    <div className="flex max-w-md flex-col gap-1">
      <Slider
        value={current}
        onChange={(next) => {
          if (typeof next === 'number') {
            setAnswer(item.linkId, { type: 'integer', value: next })
          }
        }}
        onChangeEnd={() => markTouched(item.linkId)}
        minValue={slider.min}
        maxValue={slider.max}
        step={slider.step}
        {...(described !== undefined ? { 'aria-describedby': described } : {})}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center justify-between">
          <Label className={labelClass}>{item.text ?? item.linkId}</Label>
          <SliderOutput className="text-gray-700" />
        </div>
        <SliderTrack className="relative h-6 w-full">
          {({ state }) => (
            <>
              <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded bg-gray-300" />
              <div
                className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded bg-blue-700"
                style={{ width: `${state.getThumbPercent(0) * 100}%` }}
              />
              <SliderThumb
                className={`top-1/2 size-5 rounded-full border-2 border-blue-700 bg-white data-dragging:bg-blue-100 ${focusRing}`}
              />
            </>
          )}
        </SliderTrack>
      </Slider>
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
