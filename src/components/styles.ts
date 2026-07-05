// Shared Tailwind class strings for react-aria-components, styled via their
// data-* state attributes. Focus-visible styling is themed, never removed.

export const focusRing =
  'outline-hidden data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-blue-700'

export const groupFocusRing =
  'group-data-focus-visible:outline-2 group-data-focus-visible:outline-offset-2 group-data-focus-visible:outline-blue-700'

export const labelClass = 'font-medium text-gray-900'

export const helpClass = 'text-sm text-gray-600'

export const errorClass = 'text-sm font-medium text-red-700'

export const inputClass = `w-full rounded border border-gray-500 bg-white px-3 py-1.5 text-gray-900 data-invalid:border-red-700 ${focusRing}`

export const primaryButtonClass = `rounded bg-blue-700 px-4 py-2 font-medium text-white data-hovered:bg-blue-800 data-pressed:bg-blue-900 ${focusRing}`

export const secondaryButtonClass = `rounded border border-gray-500 bg-white px-4 py-2 font-medium text-gray-900 data-hovered:bg-gray-100 data-pressed:bg-gray-200 ${focusRing}`

export const choiceRowClass =
  'group flex min-h-6 items-start gap-2 py-1 text-gray-900'

export const popoverClass =
  'min-w-(--trigger-width) rounded border border-gray-300 bg-white shadow-lg'

export const listBoxClass = 'max-h-60 overflow-auto p-1 outline-hidden'

export const optionClass = `cursor-default rounded px-3 py-1.5 text-gray-900 data-focused:bg-blue-700 data-focused:text-white ${focusRing}`

export const linkClass =
  'font-medium text-red-700 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700'
