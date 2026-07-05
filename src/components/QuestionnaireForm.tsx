import { useEffect, useState, type ReactElement } from 'react'
import { Button } from 'react-aria-components'
import type { Questionnaire } from 'fhir/r4'
import type { NormalizedItem } from '../parser/types'
import { useFormStore } from '../store/useFormStore'
import { EnableWhenAnnouncer } from './EnableWhenAnnouncer'
import { ErrorSummary } from './ErrorSummary'
import { QrControls } from './QrControls'
import { QuestionnaireItem } from './QuestionnaireItem'
import { ScorePanel } from './ScorePanel'
import { primaryButtonClass } from './styles'

interface QuestionnaireFormProps {
  items: NormalizedItem[]
  questionnaire: Questionnaire
}

export function QuestionnaireForm({
  items,
  questionnaire,
}: QuestionnaireFormProps): ReactElement {
  const hydrate = useFormStore((state) => state.hydrate)
  const attemptSubmit = useFormStore((state) => state.attemptSubmit)
  // Children render only after hydrate() so the announcer's first observed
  // enabledSet belongs to this form, not a previous one
  const [hydrated, setHydrated] = useState(false)
  const [focusTick, setFocusTick] = useState(0)

  useEffect(() => {
    hydrate(items)
    setHydrated(true)
  }, [hydrate, items])

  if (!hydrated) return <p>Loading questionnaire…</p>

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (!attemptSubmit()) setFocusTick((tick) => tick + 1)
      }}
      className="flex flex-col gap-6"
    >
      {questionnaire.title !== undefined && (
        <h2 className="text-xl font-semibold text-gray-900">
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
      <ScorePanel items={items} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" className={primaryButtonClass}>
          Submit
        </Button>
        <QrControls />
      </div>
    </form>
  )
}
