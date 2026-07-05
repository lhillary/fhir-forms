import type { ReactElement } from 'react'
import type { NormalizedItem } from '../parser/types'
import { useIsEnabled } from '../store/useFormStore'
import { BooleanField } from './fields/BooleanField'
import { DateField } from './fields/DateField'
import { DisplayItem } from './fields/DisplayItem'
import { fieldId } from './fields/fieldHelpers'
import { MultiChoiceField } from './fields/MultiChoiceField'
import { NumberField } from './fields/NumberField'
import { OpenChoiceField } from './fields/OpenChoiceField'
import { SingleChoiceField } from './fields/SingleChoiceField'
import { SliderField } from './fields/SliderField'
import { TextInputField } from './fields/TextInputField'
import { UnsupportedItem } from './fields/UnsupportedItem'

interface QuestionnaireItemProps {
  item: NormalizedItem
}

function fieldFor(item: NormalizedItem): ReactElement | null {
  switch (item.type) {
    case 'group':
      return null // rendered as fieldset by QuestionnaireItem
    case 'display':
      return <DisplayItem item={item} />
    case 'boolean':
      return <BooleanField item={item} />
    case 'string':
    case 'text':
      return <TextInputField item={item} />
    case 'integer':
      return item.control === 'slider' ? (
        <SliderField item={item} />
      ) : (
        <NumberField item={item} />
      )
    case 'decimal':
    case 'quantity':
      return <NumberField item={item} />
    case 'date':
      return <DateField item={item} />
    case 'choice':
      return item.repeats ? (
        <MultiChoiceField item={item} />
      ) : (
        <SingleChoiceField item={item} />
      )
    case 'open-choice':
      return <OpenChoiceField item={item} />
  }
}

export function QuestionnaireItem({
  item,
}: QuestionnaireItemProps): ReactElement | null {
  const enabled = useIsEnabled(item.linkId)
  if (!enabled || item.hidden) return null
  if (item.unsupported === true) return <UnsupportedItem item={item} />

  if (item.type === 'group') {
    return (
      <fieldset
        id={fieldId(item.linkId)}
        className="space-y-4 rounded border border-line p-4"
      >
        <legend className="px-1 text-lg font-semibold text-ink">
          {item.text ?? item.linkId}
        </legend>
        {item.children.map((child) => (
          <QuestionnaireItem key={child.linkId} item={child} />
        ))}
      </fieldset>
    )
  }

  return (
    <div id={fieldId(item.linkId)} className="space-y-4">
      {fieldFor(item)}
      {item.children.map((child) => (
        <QuestionnaireItem key={child.linkId} item={child} />
      ))}
    </div>
  )
}
