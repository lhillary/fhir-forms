import { useMemo, type ReactElement } from 'react'
import type { Questionnaire } from 'fhir/r4'
import kitchenSink from './fixtures/kitchen-sink.json'
import phq9 from './fixtures/phq9.json'
import { parseQuestionnaire } from './parser/parseQuestionnaire'
import { QuestionnaireForm } from './components/QuestionnaireForm'

const PHQ9 = phq9 as unknown as Questionnaire
const FORMS: Record<string, Questionnaire> = {
  phq9: PHQ9,
  'kitchen-sink': kitchenSink as unknown as Questionnaire,
}

const navLinkClass =
  'text-blue-800 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 aria-[current=page]:font-semibold'

function App(): ReactElement {
  const requested = new URLSearchParams(window.location.search).get('form')
  const formId = requested !== null && requested in FORMS ? requested : 'phq9'
  const questionnaire = FORMS[formId] ?? PHQ9
  const items = useMemo(
    () => parseQuestionnaire(questionnaire),
    [questionnaire],
  )

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">fhir-forms</h1>
      <nav aria-label="Questionnaires" className="flex gap-4">
        <a
          href="?form=phq9"
          aria-current={formId === 'phq9' ? 'page' : undefined}
          className={navLinkClass}
        >
          PHQ-9
        </a>
        <a
          href="?form=kitchen-sink"
          aria-current={formId === 'kitchen-sink' ? 'page' : undefined}
          className={navLinkClass}
        >
          Kitchen sink
        </a>
      </nav>
      <QuestionnaireForm
        key={formId}
        items={items}
        questionnaire={questionnaire}
      />
    </main>
  )
}

export default App
