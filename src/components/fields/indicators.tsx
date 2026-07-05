import type { ReactElement } from 'react'
import { groupFocusRing } from '../styles'

// Visual indicators for RAC Radio/Checkbox rows. RAC visually hides the real
// input, so the row (className "group") drives these via group-data-* state.

export function RadioIndicator(): ReactElement {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 size-5 shrink-0 rounded-full border-2 border-gray-500 bg-white group-data-selected:border-[6px] group-data-selected:border-blue-700 ${groupFocusRing}`}
    />
  )
}

export function CheckIndicator(): ReactElement {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 border-gray-500 bg-white text-white group-data-selected:border-blue-700 group-data-selected:bg-blue-700 ${groupFocusRing}`}
    >
      <svg
        viewBox="0 0 12 10"
        className="hidden size-3 group-data-selected:block"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <polyline points="1 5 4.5 8.5 11 1" />
      </svg>
    </span>
  )
}
