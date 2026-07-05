import type { QuestionnaireResponse } from 'fhir/r4'

export function downloadQrFile(qr: QuestionnaireResponse): void {
  const blob = new Blob([JSON.stringify(qr, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'questionnaire-response.json'
  anchor.click()
  URL.revokeObjectURL(url)
}
