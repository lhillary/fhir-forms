import { useState, type ReactElement } from 'react'
import { Button, FileTrigger } from 'react-aria-components'
import type { QuestionnaireResponse } from 'fhir/r4'
import { useExportQR, useFormStore } from '../store/useFormStore'
import { secondaryButtonClass } from './styles'

function isQuestionnaireResponse(
  value: unknown,
): value is QuestionnaireResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { resourceType?: unknown }).resourceType ===
      'QuestionnaireResponse'
  )
}

export function QrControls(): ReactElement {
  const qr = useExportQR()
  const loadFromQR = useFormStore((state) => state.loadFromQR)
  const [status, setStatus] = useState('')

  const exportQr = (): void => {
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

  const importFiles = async (files: FileList | null): Promise<void> => {
    const file = files?.[0]
    if (file === undefined) return
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!isQuestionnaireResponse(parsed)) {
        setStatus('Import failed: not a QuestionnaireResponse')
        return
      }
      loadFromQR(parsed)
      setStatus('QuestionnaireResponse imported')
    } catch {
      setStatus('Import failed: file is not valid JSON')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onPress={exportQr} className={secondaryButtonClass}>
        Export QuestionnaireResponse
      </Button>
      <FileTrigger
        acceptedFileTypes={['application/json', '.json']}
        onSelect={(files) => {
          void importFiles(files)
        }}
      >
        <Button className={secondaryButtonClass}>Import QR</Button>
      </FileTrigger>
      <p role="status" className="text-sm text-gray-700">
        {status}
      </p>
    </div>
  )
}
