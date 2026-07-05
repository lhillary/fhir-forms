import type { ReactElement } from 'react'
import {
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  Text,
} from 'react-aria-components'
import {
  errorClass,
  focusRing,
  helpClass,
  labelClass,
  listBoxClass,
  optionClass,
  popoverClass,
} from '../styles'
import { errorText, type ChoiceProps } from './fieldHelpers'

const triggerClass = `flex w-full items-center justify-between gap-2 rounded-md border border-edge bg-white px-3 py-1.5 text-left text-ink data-invalid:border-danger ${focusRing}`

export function ChoiceSelect({
  item,
  selectedKey,
  errors,
  onSelect,
  onBlur,
}: ChoiceProps): ReactElement {
  return (
    <Select
      selectedKey={selectedKey}
      onSelectionChange={(key) => onSelect(key === null ? null : String(key))}
      onBlur={onBlur}
      isRequired={item.required}
      isInvalid={errors.length > 0}
      placeholder="Select an option"
      className="flex max-w-md flex-col gap-1"
    >
      <Label className={labelClass}>{item.text ?? item.linkId}</Label>
      {item.helpText !== undefined && (
        <Text slot="description" className={helpClass}>
          {item.helpText}
        </Text>
      )}
      <Button className={triggerClass}>
        <SelectValue className="data-placeholder:text-ink-muted" />
        <span aria-hidden="true">▼</span>
      </Button>
      <FieldError className={errorClass}>{errorText(errors)}</FieldError>
      <Popover className={popoverClass}>
        <ListBox className={listBoxClass}>
          {(item.options ?? []).map((option) => (
            <ListBoxItem
              key={option.code}
              id={option.code}
              className={optionClass}
            >
              {option.display}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  )
}
