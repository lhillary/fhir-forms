import type { ReactElement } from 'react'
import { useFormStore, useVisibleErrors } from '../../store/useFormStore'
import { ChoiceComboBox } from './ChoiceComboBox'
import { ChoiceRadioGroup } from './ChoiceRadioGroup'
import { ChoiceSelect } from './ChoiceSelect'
import {
  answerKey,
  optionToAnswer,
  singleAnswer,
  type FieldProps,
} from './fieldHelpers'

export function SingleChoiceField({ item }: FieldProps): ReactElement {
  const value = useFormStore((state) => state.answers[item.linkId])
  const setAnswer = useFormStore((state) => state.setAnswer)
  const markTouched = useFormStore((state) => state.markTouched)
  const errors = useVisibleErrors(item.linkId)

  const selectedKey = answerKey(singleAnswer(value))
  const onSelect = (key: string | null): void => {
    const option = item.options?.find((candidate) => candidate.code === key)
    setAnswer(item.linkId, option !== undefined ? optionToAnswer(option) : [])
  }
  const shared = {
    item,
    selectedKey,
    errors,
    onSelect,
    onBlur: () => markTouched(item.linkId),
  }

  if (item.control === 'drop-down') return <ChoiceSelect {...shared} />
  if (item.control === 'autocomplete') return <ChoiceComboBox {...shared} />
  return <ChoiceRadioGroup {...shared} />
}
