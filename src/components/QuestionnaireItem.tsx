import type { ReactElement } from 'react'
import type { NormalizedItem } from '../parser/types'

interface QuestionnaireItemProps {
  item: NormalizedItem
}

// Placeholder dispatcher — real field components arrive in a later session.
export function QuestionnaireItem({ item }: QuestionnaireItemProps): ReactElement {
  return (
    <li>
      <span>{item.text ?? item.linkId}</span>
      {item.children.length > 0 && (
        <ul>
          {item.children.map((child) => (
            <QuestionnaireItem key={child.linkId} item={child} />
          ))}
        </ul>
      )}
    </li>
  )
}
