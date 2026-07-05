import { useEffect, useRef, useState, type ReactElement } from 'react'
import { Button } from 'react-aria-components'
import type { QuestionnaireResponse } from 'fhir/r4'
import type { NormalizedItem } from './parser/types'
import { downloadQrFile } from './components/downloadQr'
import { ScorePanel, type SeverityBand } from './components/ScorePanel'
import {
  cardClass,
  primaryButtonClass,
  secondaryButtonClass,
} from './components/styles'

interface CompletedViewProps {
  qr: QuestionnaireResponse
  items: NormalizedItem[]
  bands?: readonly SeverityBand[] | undefined
  onStartOver: () => void
}

// Demo-layer completion screen. The reusable form only hands the finalized QR
// to onSubmit; showing this view, downloading, and starting over are the host
// app's concern.
export function CompletedView({
  qr,
  items,
  bands,
  onStartOver,
}: CompletedViewProps): ReactElement {
  const headingRef = useRef<HTMLHeadingElement>(null)
  // Set after mount so the live region announces the transition
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    headingRef.current?.focus()
    setAnnouncement('Questionnaire completed')
  }, [])

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-6">
      <div className={`${cardClass} flex flex-col gap-6`}>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-semibold text-ink"
        >
          Questionnaire completed
        </h2>
        <p className="text-ink-muted">
          Your answers are finalized as a FHIR QuestionnaireResponse. Nothing
          has been sent anywhere — you can download it below, or start over.
        </p>
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onPress={() => downloadQrFile(qr)}
            className={primaryButtonClass}
          >
            Download QuestionnaireResponse
          </Button>
          <Button onPress={onStartOver} className={secondaryButtonClass}>
            Start over
          </Button>
        </div>
      </div>
      <aside className="mt-6 lg:sticky lg:top-6 lg:mt-0">
        <ScorePanel items={items} bands={bands} />
      </aside>
    </div>
  )
}
