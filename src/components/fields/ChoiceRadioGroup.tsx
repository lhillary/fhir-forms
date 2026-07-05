import type { ReactElement } from 'react'
import {
  FieldError,
  Label,
  Radio,
  RadioGroup,
  Text,
} from 'react-aria-components'
import { choiceRowClass, errorClass, helpClass, labelClass } from '../styles'
import { errorText, type ChoiceProps } from './fieldHelpers'
import { RadioIndicator } from './indicators'

export function ChoiceRadioGroup({
  item,
  selectedKey,
  errors,
  onSelect,
  onBlur,
}: ChoiceProps): ReactElement {
  return (
    <RadioGroup
      value={selectedKey}
      onChange={onSelect}
      onBlur={onBlur}
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
          <Radio
            key={option.code}
            value={option.code}
            className={choiceRowClass}
          >
            <RadioIndicator />
            {option.display}
          </Radio>
        ))}
      </div>
      <FieldError className={errorClass}>{errorText(errors)}</FieldError>
    </RadioGroup>
  )
}
