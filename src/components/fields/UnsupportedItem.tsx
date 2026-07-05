import type { ReactElement } from 'react'
import type { FieldProps } from './fieldHelpers'

export function UnsupportedItem({ item }: FieldProps): ReactElement {
  const typeNote = item.rawType !== undefined ? ` (${item.rawType})` : ''
  return (
    <div className="rounded border border-dashed border-gray-400 p-3">
      <p className="text-gray-800">{item.text ?? item.linkId}</p>
      <p className="text-sm text-gray-600">
        Unsupported field type{typeNote} — this question cannot be answered
        here.
      </p>
    </div>
  )
}
