import type { ReactElement } from 'react'
import type { Questionnaire } from 'fhir/r4'
import phq9 from './fixtures/phq9.json'
import { parseQuestionnaire } from './parser/parseQuestionnaire'
import { QuestionnaireForm } from './components/QuestionnaireForm'

const items = parseQuestionnaire(phq9 as unknown as Questionnaire)

function App(): ReactElement {
  return (
    <main>
      <h1>fhir-forms</h1>
      <QuestionnaireForm items={items} />
    </main>
  )
}

export default App
