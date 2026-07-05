import type { ReactElement } from 'react'
import type { NormalizedItem } from '../parser/types'
import { QuestionnaireItem } from './QuestionnaireItem'

interface QuestionnaireFormProps {
  items: NormalizedItem[]
}

// Placeholder shell — error summary, scoring, and submit will come later
export function QuestionnaireForm({ items }: QuestionnaireFormProps): ReactElement {
  return (
    <form noValidate>
      <ul>
        {items.map((item) => (
          <QuestionnaireItem key={item.linkId} item={item} />
        ))}
      </ul>
    </form>
  )
}
