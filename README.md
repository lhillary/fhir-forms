# FHIR Form Engine

A client-side, schema-driven renderer for FHIR **R4** `Questionnaire` resources. Point it at
a `Questionnaire` and it produces an accessible, validated form, computes scores live, and
emits a spec-valid `QuestionnaireResponse`. Round-trip fidelity means a previously captured
response can be re-imported and edited.

> **Not for clinical use.** This is a demonstration and portfolio project. Nothing it
> renders, scores, or exports is suitable for clinical, diagnostic, or treatment purposes.

## Why this exists

Two things carry the most weight in the design, because they are the point of the project:

1. **FHIR correctness.** Few frontend engineers work with FHIR. Faithful handling of the
   `Questionnaire` item model, SDC extensions, and the `QuestionnaireResponse` shape is a
   real and underserved skill.
2. **Real WCAG 2.2 AA accessibility.** Clinical form rendering is a hard accessibility and
   state problem: conditional fields, live scores, error recovery. The proof is automated in
   CI rather than claimed in a bullet point.

## Features

**Item types:** `group`, `display`, `boolean`, `string`, `text`, `integer`, `decimal`,
`date`, `choice`, `open-choice`, `quantity`.

**Item controls** (SDC `questionnaire-item-control`): `radio-button`, `check-box`,
`drop-down`, `slider`, `autocomplete`.

**Behaviors:**

- `enableWhen` conditional logic with `enableBehavior` any/all and operators
  `exists | = | != | > | < | >= | <=`.
- Validation: `required`, `maxLength`, `regex` / `entryFormat`, min/max value, min/max date.
- Live scoring via FHIRPath item weights, supporting the R4 to R5 rename (`ordinalValue` in
  R4, `itemWeight` in R5). PHQ-9, which has published cut-offs, gets a data-driven severity
  readout next to the total.
- `QuestionnaireResponse` export and import, with a lossless round-trip for every supported
  type. Imports are validated before loading; a bad file produces a status message rather
  than a crash.
- App shell: form picker synced to `?form=`, per-form document titles, a skip-to-form link,
  a confirm-guarded reset, and an error boundary so a bad questionnaire cannot blank the
  screen.

**Bundled questionnaires:** the real **PHQ-9**, plus a synthetic **kitchen-sink** form that
exercises every supported type, control, `enableWhen` operator, and validation rule. The
kitchen-sink form drives the demo and the accessibility sweeps. The renderer is
instrument-agnostic, so more questionnaires can be added as fixtures.

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

Dependencies point downward only. After `parser/`, nothing touches raw `fhir4.*` again;
`NormalizedItem` is the boundary. `engine/` is framework-free and never imports React or the
store. `components/` carry no FHIR logic; they render from a `NormalizedItem` plus store
state, and read enabled, error, and score values through store selectors.

The result is that FHIR's variability is isolated in one exhaustively tested layer, all form
logic stays pure and unit-testable, and the component layer focuses entirely on
accessibility.

## Tech stack

- **React 19**, **TypeScript** (strict, including `noUncheckedIndexedAccess`), **Vite**.
- **react-aria-components** for accessible primitives: radio groups, selects, sliders,
  comboboxes, date pickers. Not hand-rolled, not Radix.
- **Zustand** for state, normalized by `linkId`. Not React Hook Form.
- **fhirpath** for scoring (`weight()` for item weights).
- **Tailwind CSS v4.** Color and type styling flows through a small semantic token set
  defined in [`src/index.css`](src/index.css).
- **Vitest**, Testing Library, and jsdom for unit and component tests.
- **Playwright** and axe-core for end-to-end and accessibility sweeps.

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

Requires **Node 22** and **pnpm 10**.

```bash
pnpm install
pnpm dev
```

### Scripts

| Script          | What it does                                        |
| --------------- | --------------------------------------------------- |
| `pnpm dev`      | Start the dev server                                |
| `pnpm build`    | Type-check (`tsc -b`) and production build to `dist/` |
| `pnpm preview`  | Preview the production build                        |
| `pnpm test`     | Vitest (watch)                                      |
| `pnpm test:run` | Vitest (single run)                                 |
| `pnpm test:e2e` | Playwright (builds and previews, then runs `e2e/`)  |
| `pnpm format`   | Prettier `--write .`                                |

## Testing and accessibility

Accessibility is treated as a functional requirement:

- Choice groups use `fieldset` and `legend`. Every field has a programmatic label, with help
  text and errors wired via `aria-describedby`, plus `aria-invalid` and `aria-required`.
- On a failed submit, an error summary lists each error as an in-page link and moves focus to
  itself.
- `enableWhen` changes are announced through an `aria-live` region, so screen-reader users
  never silently gain or lose fields.
- Everything is fully keyboard-operable, with a visible focus indicator on every control.
  There is a Playwright test that completes the PHQ-9 without a single pointer event.
- The axe sweep (WCAG 2.2 AA tags) runs against every bundled form in its initial,
  enableWhen-expanded, error, and dialog-open states. A violation fails CI.

On the unit side, `parser/` and `engine/` are pure and exhaustively tested: truth tables for
`enableWhen`, known totals for scoring, and `toQR(fromQR(x))` round-trip equality. Rendering
components get Testing Library behavior tests.

## CI/CD

[`ci.yml`](.github/workflows/ci.yml) runs on every push to `main` and every pull request:
`pnpm install`, `pnpm test:run`, `pnpm build`, then `pnpm test:e2e` (which includes the axe
accessibility gate). Deploys run only after that job passes. A push to `main` deploys to
production on Cloudflare Pages; a pull request deploys a preview build. A failed test run
blocks both.