// Shared Tailwind class strings for react-aria-components, styled via their
// data-* state attributes and the semantic tokens in src/index.css.
// Focus-visible styling is themed, never removed.

export const focusRing =
  'outline-hidden data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-focus'

export const groupFocusRing =
  'group-data-focus-visible:outline-2 group-data-focus-visible:outline-offset-2 group-data-focus-visible:outline-focus'

export const labelClass = 'font-medium text-ink'

export const helpClass = 'text-sm text-ink-muted'

export const errorClass = 'text-sm font-medium text-danger'

export const inputClass = `w-full rounded-md border border-edge bg-surface px-3 py-1.5 text-ink data-invalid:border-danger ${focusRing}`

export const primaryButtonClass = `rounded-md bg-primary px-4 py-2 font-medium text-white data-hovered:bg-primary-strong data-pressed:bg-primary-stronger ${focusRing}`

export const secondaryButtonClass = `rounded-md border border-edge bg-surface px-4 py-2 font-medium text-ink data-hovered:bg-tint data-pressed:bg-tint-strong ${focusRing}`

export const dangerButtonClass = `rounded-md bg-danger px-4 py-2 font-medium text-white data-hovered:bg-danger-strong data-pressed:bg-danger-strong ${focusRing}`

export const choiceRowClass =
  'group flex min-h-6 items-start gap-2 py-1 text-ink'

export const popoverClass =
  'min-w-(--trigger-width) rounded-md border border-line bg-surface shadow-lg'

export const listBoxClass = 'max-h-60 overflow-auto p-1 outline-hidden'

export const optionClass = `cursor-default rounded px-3 py-1.5 text-ink data-focused:bg-primary data-focused:text-white ${focusRing}`

export const linkClass =
  'font-medium text-danger underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

export const cardClass =
  'rounded-lg border border-line bg-surface p-6 shadow-sm'

export const overlayClass =
  'fixed inset-0 z-10 flex items-center justify-center bg-ink/40 p-4'

export const dialogClass = `max-w-md rounded-lg border border-line bg-surface p-6 shadow-lg ${focusRing}`
