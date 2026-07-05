import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import type { Questionnaire, QuestionnaireResponse } from 'fhir/r4'
import kitchenSink from './fixtures/kitchen-sink.json'
import phq9 from './fixtures/phq9.json'
import { parseQuestionnaire } from './parser/parseQuestionnaire'
import { ErrorBoundary } from './components/ErrorBoundary'
import { QuestionnaireForm } from './components/QuestionnaireForm'
import type { SeverityBand } from './components/ScorePanel'
import { CompletedView } from './CompletedView'
import { SEVERITY_BANDS } from './severityBands'
import { useFormStore } from './store/useFormStore'

interface FormEntry {
  questionnaire: Questionnaire
  label: string
}

const DEFAULT_FORM_ID = 'phq9'
const FORMS: Record<string, FormEntry> = {
  phq9: { questionnaire: phq9 as unknown as Questionnaire, label: 'PHQ-9' },
  'kitchen-sink': {
    questionnaire: kitchenSink as unknown as Questionnaire,
    label: 'Kitchen Sink',
  },
}

function readFormId(): string {
  const requested = new URLSearchParams(window.location.search).get('form')
  return requested !== null && requested in FORMS ? requested : DEFAULT_FORM_ID
}

function formEntry(formId: string): FormEntry {
  return FORMS[formId] ?? (FORMS[DEFAULT_FORM_ID] as FormEntry)
}

const skipLinkClass =
  'sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

const navLinkClass =
  'rounded-md px-3 py-1.5 font-medium text-ink-muted hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-[current=page]:bg-primary-tint aria-[current=page]:text-primary-stronger'

interface FormViewProps {
  questionnaire: Questionnaire
  bands: readonly SeverityBand[] | undefined
  focusHeading: boolean
}

function FormView({
  questionnaire,
  bands,
  focusHeading,
}: FormViewProps): ReactElement {
  const items = useMemo(
    () => parseQuestionnaire(questionnaire),
    [questionnaire],
  )
  const [submittedQr, setSubmittedQr] = useState<QuestionnaireResponse | null>(
    null,
  )
  // Set by "Start over" so the remounted form focuses its heading, mirroring
  // an in-app form switch
  const [restarted, setRestarted] = useState(false)
  const reset = useFormStore((state) => state.reset)

  if (submittedQr !== null)
    return (
      <CompletedView
        qr={submittedQr}
        items={items}
        bands={bands}
        onStartOver={() => {
          reset()
          setSubmittedQr(null)
          setRestarted(true)
        }}
      />
    )

  return (
    <QuestionnaireForm
      items={items}
      questionnaire={questionnaire}
      bands={bands}
      focusHeadingOnMount={focusHeading || restarted}
      onSubmit={setSubmittedQr}
    />
  )
}

function App(): ReactElement {
  const [formId, setFormId] = useState(readFormId)
  // Focus moves to the form heading only after an in-app switch, never on
  // initial load
  const switched = useRef(false)
  const { questionnaire } = formEntry(formId)

  useEffect(() => {
    const onPopState = (): void => {
      switched.current = true
      setFormId(readFormId())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    document.title = `${questionnaire.title ?? formId} · FHIR Form Engine`
  }, [questionnaire, formId])

  const selectForm = (id: string): void => {
    if (id === formId) return
    window.history.pushState(null, '', `?form=${id}`)
    switched.current = true
    setFormId(id)
  }

  return (
    <div className="min-h-screen">
      <a href="#form-region" className={skipLinkClass}>
        Skip to form
      </a>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-ink">FHIR Form Engine</h1>
          <nav aria-label="Questionnaires" className="flex gap-1">
            {Object.entries(FORMS).map(([id, { label }]) => (
              <a
                key={id}
                href={`?form=${id}`}
                aria-current={formId === id ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  selectForm(id)
                }}
                className={navLinkClass}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main
        id="form-region"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl px-4 py-6 outline-hidden sm:px-6 sm:py-8"
      >
        <ErrorBoundary key={formId}>
          <FormView
            questionnaire={questionnaire}
            bands={SEVERITY_BANDS[formId]}
            focusHeading={switched.current}
          />
        </ErrorBoundary>
      </main>
    </div>
  )
}

export default App
