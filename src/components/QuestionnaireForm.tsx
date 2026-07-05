import { useEffect, useRef, useState, type ReactElement } from 'react'
import { Button } from 'react-aria-components'
import type { Questionnaire } from 'fhir/r4'
import type { NormalizedItem } from '../parser/types'
import { useFormStore } from '../store/useFormStore'
import { EnableWhenAnnouncer } from './EnableWhenAnnouncer'
import { ErrorSummary } from './ErrorSummary'
import { QrControls } from './QrControls'
import { QuestionnaireItem } from './QuestionnaireItem'
import { ResetButton } from './ResetButton'
import { ScorePanel, type SeverityBand } from './ScorePanel'
import { cardClass, primaryButtonClass } from './styles'

interface QuestionnaireFormProps {
  items: NormalizedItem[]
  questionnaire: Questionnaire
  bands?: readonly SeverityBand[] | undefined
  // Set when the user switched forms in-app, so focus lands on the new
  // form's heading instead of staying on the picker
  focusHeadingOnMount?: boolean | undefined
}

export function QuestionnaireForm({
  items,
  questionnaire,
  bands,
  focusHeadingOnMount = false,
}: QuestionnaireFormProps): ReactElement {
  const hydrate = useFormStore((state) => state.hydrate)
  const attemptSubmit = useFormStore((state) => state.attemptSubmit)
  // Children render only after hydrate() so the announcer's first observed
  // enabledSet belongs to this form, not a previous one
  const [hydrated, setHydrated] = useState(false)
  const [focusTick, setFocusTick] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    hydrate(items)
    setHydrated(true)
  }, [hydrate, items])

  useEffect(() => {
    if (hydrated && focusHeadingOnMount) headingRef.current?.focus()
  }, [hydrated, focusHeadingOnMount])

  if (!hydrated) return <p className="text-ink-muted">Loading questionnaire…</p>

  if (items.length === 0)
    return (
      <p className={`${cardClass} text-ink-muted`}>
        This questionnaire has no questions to display.
      </p>
    )

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (!attemptSubmit()) setFocusTick((tick) => tick + 1)
      }}
      className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-6"
    >
      <div className={`${cardClass} flex flex-col gap-6`}>
        {questionnaire.title !== undefined && (
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-semibold text-ink"
          >
            {questionnaire.title}
          </h2>
        )}
        <ErrorSummary items={items} focusTick={focusTick} />
        <EnableWhenAnnouncer items={items} />
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <QuestionnaireItem key={item.linkId} item={item} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" className={primaryButtonClass}>
            Submit
          </Button>
          <QrControls />
          <ResetButton />
        </div>
      </div>
      <aside className="mt-6 lg:sticky lg:top-6 lg:mt-0">
        <ScorePanel items={items} bands={bands} />
      </aside>
    </form>
  )
}
