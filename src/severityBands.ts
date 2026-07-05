import type { SeverityBand } from './components/ScorePanel'

// Published severity cut-offs for the bundled instruments, keyed by form id
// (the ?form= value). Instruments without standard bands (e.g. the kitchen
// sink) simply have no entry and the score panel shows the raw total only.
export const SEVERITY_BANDS: Record<string, readonly SeverityBand[]> = {
  phq9: [
    { min: 0, max: 4, label: 'Minimal depression' },
    { min: 5, max: 9, label: 'Mild depression' },
    { min: 10, max: 14, label: 'Moderate depression' },
    { min: 15, max: 19, label: 'Moderately severe depression' },
    { min: 20, max: 27, label: 'Severe depression' },
  ],
  gad7: [
    { min: 0, max: 4, label: 'Minimal anxiety' },
    { min: 5, max: 9, label: 'Mild anxiety' },
    { min: 10, max: 14, label: 'Moderate anxiety' },
    { min: 15, max: 21, label: 'Severe anxiety' },
  ],
}
