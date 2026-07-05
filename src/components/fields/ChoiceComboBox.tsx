import type { ReactElement } from 'react'
import {
  Button,
  ComboBox,
  FieldError,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Text,
} from 'react-aria-components'
import type { NormalizedAnswerOption } from '../../parser/types'
import {
  errorClass,
  focusRing,
  helpClass,
  inputClass,
  labelClass,
  listBoxClass,
  optionClass,
  popoverClass,
} from '../styles'
import { errorText, type ChoiceProps } from './fieldHelpers'

export function ChoiceComboBox({
  item,
  selectedKey,
  errors,
  onSelect,
  onBlur,
}: ChoiceProps): ReactElement {
  return (
    <ComboBox
      selectedKey={selectedKey}
      onSelectionChange={(key) => onSelect(key === null ? null : String(key))}
      onBlur={onBlur}
      isRequired={item.required}
      isInvalid={errors.length > 0}
      defaultItems={item.options ?? []}
      className="flex max-w-md flex-col gap-1"
    >
      <Label className={labelClass}>{item.text ?? item.linkId}</Label>
      {item.helpText !== undefined && (
        <Text slot="description" className={helpClass}>
          {item.helpText}
        </Text>
      )}
      <div className="flex items-center gap-1">
        <Input className={inputClass} />
        <Button
          className={`rounded px-2 py-1.5 text-ink-muted data-hovered:bg-tint ${focusRing}`}
        >
          <span aria-hidden="true">▼</span>
        </Button>
      </div>
      <FieldError className={errorClass}>{errorText(errors)}</FieldError>
      <Popover className={popoverClass}>
        <ListBox className={listBoxClass}>
          {(option: NormalizedAnswerOption) => (
            <ListBoxItem
              id={option.code}
              textValue={option.display}
              className={optionClass}
            >
              {option.display}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  )
}
