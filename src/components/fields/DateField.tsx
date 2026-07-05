import { parseDate, type CalendarDate } from '@internationalized/date'
import type { ReactElement } from 'react'
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DatePicker,
  DateSegment,
  Dialog,
  FieldError,
  Group,
  Heading,
  Label,
  Popover,
  Text,
} from 'react-aria-components'
import { useFormStore, useVisibleErrors } from '../../store/useFormStore'
import {
  errorClass,
  focusRing,
  helpClass,
  labelClass,
  popoverClass,
} from '../styles'
import { errorText, singleAnswer, type FieldProps } from './fieldHelpers'

const segmentClass = `rounded px-0.5 text-gray-900 tabular-nums outline-hidden data-focused:bg-blue-700 data-focused:text-white data-placeholder:text-gray-600`

const cellClass = `flex size-9 items-center justify-center rounded text-gray-900 data-hovered:bg-gray-100 data-selected:bg-blue-700 data-selected:text-white data-disabled:text-gray-400 data-outside-month:hidden ${focusRing}`

const navButtonClass = `rounded px-2 py-1 text-gray-700 data-hovered:bg-gray-100 ${focusRing}`

function toCalendarDate(value: string): CalendarDate | null {
  try {
    return parseDate(value)
  } catch {
    return null
  }
}

export function DateField({ item }: FieldProps): ReactElement {
  const value = useFormStore((state) => state.answers[item.linkId])
  const setAnswer = useFormStore((state) => state.setAnswer)
  const markTouched = useFormStore((state) => state.markTouched)
  const errors = useVisibleErrors(item.linkId)

  const answer = singleAnswer(value)
  const current = answer?.type === 'date' ? toCalendarDate(answer.value) : null
  const minValue =
    item.constraints.minDate !== undefined
      ? toCalendarDate(item.constraints.minDate)
      : null
  const maxValue =
    item.constraints.maxDate !== undefined
      ? toCalendarDate(item.constraints.maxDate)
      : null

  return (
    <DatePicker
      value={current}
      onChange={(next) =>
        setAnswer(
          item.linkId,
          next !== null ? { type: 'date', value: next.toString() } : [],
        )
      }
      onBlur={() => markTouched(item.linkId)}
      isRequired={item.required}
      isInvalid={errors.length > 0}
      {...(minValue !== null ? { minValue } : {})}
      {...(maxValue !== null ? { maxValue } : {})}
      className="flex max-w-md flex-col gap-1"
    >
      <Label className={labelClass}>{item.text ?? item.linkId}</Label>
      {item.helpText !== undefined && (
        <Text slot="description" className={helpClass}>
          {item.helpText}
        </Text>
      )}
      <Group className="flex items-center justify-between rounded border border-gray-500 bg-white px-3 py-1.5 data-invalid:border-red-700">
        <DateInput className="flex">
          {(segment) => (
            <DateSegment segment={segment} className={segmentClass} />
          )}
        </DateInput>
        <Button className={navButtonClass}>
          <span aria-hidden="true">▼</span>
        </Button>
      </Group>
      <FieldError className={errorClass}>{errorText(errors)}</FieldError>
      <Popover className={popoverClass}>
        <Dialog className="p-3 outline-hidden">
          <Calendar>
            <header className="flex items-center justify-between pb-2">
              <Button slot="previous" className={navButtonClass}>
                ‹
              </Button>
              <Heading className="font-medium text-gray-900" />
              <Button slot="next" className={navButtonClass}>
                ›
              </Button>
            </header>
            <CalendarGrid>
              {(date) => <CalendarCell date={date} className={cellClass} />}
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </DatePicker>
  )
}
