# FHIR Form Engine

A client-side, schema-driven renderer for FHIR **R4** `Questionnaire` resources. Point it at
a `Questionnaire` and it produces an accessible, validated form, computes scores live, and
emits a spec-valid `QuestionnaireResponse`. Round-trip fidelity means a previously
captured response can be re-imported and edited.

> **Not for clinical use.** This is a demonstration/portfolio project. Nothing it renders,
> scores, or exports is suitable for clinical, diagnostic, or treatment purposes.

## Why this exists

Two things get extra weight in every decision here, because they are the thesis of the
project:

1. **FHIR correctness** — almost no frontend engineer can speak FHIR. Faithful handling of
   the `Questionnaire` item model, SDC extensions, and the `QuestionnaireResponse` shape is
   a real, underserved skill.
2. **Real WCAG 2.2 AA accessibility** — clinical form rendering is a genuinely hard
   accessibility-and-state problem (conditional fields, live scores, error recovery), and
   the proof is automated in CI, not claimed in a bullet point.

## Screenshots

<!-- placeholder: PHQ-9 on desktop with the sticky score panel -->

![PHQ-9 rendered form](docs/screenshots/phq9-desktop.png)

<!-- placeholder: kitchen-sink form showing slider, combobox, and date picker -->

![Kitchen-sink form](docs/screenshots/kitchen-sink.png)

<!-- placeholder: error summary after an empty submit -->

![Error summary state](docs/screenshots/error-summary.png)

## Features

**Item types:** `group`, `display`, `boolean`, `string`, `text`, `integer`, `decimal`,
`date`, `choice`, `open-choice`, `quantity`.

**Item controls** (SDC `questionnaire-item-control`): `radio-button`, `check-box`,
`drop-down`, `slider`, `autocomplete`.

**Behaviors:**

- `enableWhen` conditional logic with `enableBehavior` any/all and operators
  `exists | = | != | > | < | >= | <=`
- Validation: `required`, `maxLength`, `regex` / `entryFormat`, min/max value, min/max date
- Live scoring via FHIRPath item weights, supporting the R4→R5 rename (`ordinalValue` in R4,
  `itemWeight` in R5). Instruments with published cut-offs (PHQ-9, GAD-7) get a data-driven
  severity readout next to the total.
- `QuestionnaireResponse` export **and** import, with a lossless round-trip for every
  supported type. Imports are validated before loading; bad files produce a status message,
  never a crash.
- App shell niceties: form picker synced to `?form=`, per-form document titles, a
  skip-to-form link, confirm-guarded reset, and an error boundary so a bad questionnaire
  can't blank the screen.

**Bundled questionnaires:** the real **PHQ-9** plus a synthetic **kitchen-sink** form that
exercises every supported type, control, `enableWhen` operator, and validation rule (it
drives the demo and the a11y sweeps). GAD-7 and WHODAS 2.0 (12-item) are next in line.

## Architecture

Four layers with strictly one-way dependencies. Each layer depends only on the one above it:

```
parser/      raw FHIR  ->  NormalizedItem tree; resolves ALL extensions    (no React)
   |
engine/      pure logic: enableWhen, validation, scoring, QR (de)serialize (no React, no store)
   |
store/       Zustand; answers normalized by linkId; selectors call engine
   |
components/  recursive renderer; react-aria-components; reads store only
```

**Hard rule: dependencies point downward only.** After `parser/`, nothing touches raw
`fhir4.*` again; `NormalizedItem` is the boundary. `engine/` is framework-free and never
imports React or the store. `components/` carry no FHIR logic; they render from a
`NormalizedItem` plus store state, and read enabled/error/score purely through store
selectors.

The payoff: FHIR's messiness is isolated in one exhaustively-tested layer, all form logic
stays pure and unit-testable, and the component layer is free to focus entirely on
accessibility.

## Tech stack

- **React 19** + **TypeScript** (strict, including `noUncheckedIndexedAccess`) + **Vite**
- **react-aria-components** for accessible primitives: radio groups, selects, sliders,
  comboboxes, date pickers. Not hand-rolled, not Radix.
- **Zustand** for state, normalized by `linkId`. Not React Hook Form.
- **fhirpath** for scoring (`weight()` for item weights)
- **Tailwind CSS v4** — all color/type styling flows through a small semantic token set
  defined in [`src/index.css`](src/index.css)
- **Vitest** + Testing Library + jsdom for unit and component tests
- **Playwright** + axe-core for end-to-end and accessibility sweeps

## Project structure

```
src/
  parser/       types.ts, parseQuestionnaire.ts          FHIR -> NormalizedItem
  engine/       enableWhen.ts, validation.ts, scoring.ts, qr.ts
  store/        useFormStore.ts
  components/   QuestionnaireForm.tsx, QuestionnaireItem.tsx, fields/
  fixtures/     phq9.json, kitchen-sink.json
  severityBands.ts                                       published score cut-offs
  App.tsx
```

No barrel files; imports come straight from the source module.

## Getting started

Requires **Node 20+** and **pnpm**.

```bash
pnpm install
pnpm dev
```

### Scripts

| Script          | What it does                                        |
| --------------- | --------------------------------------------------- |
| `pnpm dev`      | Start the dev server                                |
| `pnpm build`    | Type-check (`tsc -b`) + production build to `dist/` |
| `pnpm preview`  | Preview the production build                        |
| `pnpm test`     | Vitest (watch)                                      |
| `pnpm test:run` | Vitest (single run)                                 |
| `pnpm test:e2e` | Playwright (builds + previews, then runs `e2e/`)    |
| `pnpm format`   | Prettier `--write .`                                |

## Testing & accessibility

Accessibility is treated as a functional requirement:

- Choice groups use `fieldset` / `legend`; every field has a programmatic label, with help
  text and errors wired via `aria-describedby`, plus `aria-invalid` and `aria-required`.
- On a failed submit, an error summary lists each error as an in-page link and moves focus to
  itself.
- `enableWhen` changes are announced through an `aria-live` region, so screen-reader users
  never silently gain or lose fields.
- Everything is fully keyboard-operable — there is a Playwright test that completes the
  PHQ-9 without a single pointer event — with a visible focus indicator on every control.
- The axe sweep (WCAG 2.2 AA tags) runs against every bundled form in its initial,
  enableWhen-expanded, error, and dialog-open states. A violation fails CI.

On the unit side: `parser/` and `engine/` are pure and exhaustively tested (truth tables for
`enableWhen`, known totals for scoring, `toQR(fromQR(x))` round-trip equality); rendering
components get Testing Library behavior tests.

## CI

[`ci.yml`](.github/workflows/ci.yml) runs on every push to `main` and on every pull
request: `pnpm install` → `pnpm test:run` → `pnpm build` → `pnpm test:e2e` (which includes
the axe accessibility gate). CI is a quality gate only — deployment is manual and
intentionally not part of the workflow.
