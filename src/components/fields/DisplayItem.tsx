import type { ReactElement } from 'react'
import type { FieldProps } from './fieldHelpers'

export function DisplayItem({ item }: FieldProps): ReactElement {
  return <p className="text-ink">{item.text}</p>
}
