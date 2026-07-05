# fhir-forms

A client-side, schema-driven renderer for FHIR **R4** `Questionnaire` resources. Point it at
a `Questionnaire` and it produces an accessible, validated form, computes scores live, and
emits a spec-valid `QuestionnaireResponse` — with round-trip fidelity, so a previously
captured response can be re-imported and edited.

## Features

**FHIR correctness** — faithful handling of the item model, extensions, and the
   `QuestionnaireResponse` shape.

**Real WCAG 2.2 AA accessibility** — with automated proof in CI (axe).

**Item types:** `group`, `display`, `boolean`, `string`, `text`, `integer`, `decimal`,
`date`, `choice`, `open-choice`, `quantity`.

**Item controls** (SDC `questionnaire-item-control`): `radio-button`, `check-box`,
`drop-down`, `slider`, `autocomplete`.

**Behaviors:**

- `enableWhen` conditional logic with `enableBehavior` any/all and operators
  `exists | = | != | > | < | >= | <=`
- Validation: `required`, `maxLength`, `regex` / `entryFormat`, min/max value, min/max date
- Live scoring via FHIRPath item weights, supporting the R4→R5 rename (`ordinalValue` in R4,
  `itemWeight` in R5). Totals carry severity bands where the instrument defines them
  (e.g. PHQ-9 0–27 minimal→severe; GAD-7 0–21 minimal→severe).
- `QuestionnaireResponse` export **and** import, with a lossless round-trip for every
  supported type.

**Bundled instruments:** PHQ-9, GAD-7, WHODAS 2.0 (12-item), plus a synthetic *kitchen-sink*
questionnaire that exercises every supported type, control, `enableWhen` operator, and
validation rule.

## Architecture

Four layers with strictly one-way dependencies — each layer depends only on the one above it:

```
parser/      raw FHIR  ->  NormalizedItem tree; resolves ALL extensions    (no React)
   |
engine/      pure logic: enableWhen, validation, scoring, QR (de)serialize (no React, no store)
   |
store/       Zustand; answers normalized by linkId; selectors call engine
   |
components/  recursive renderer; react-aria-components; reads store only
```

**Hard rule — dependencies point downward only.** After `parser/`, nothing touches raw
`fhir4.*` again; `NormalizedItem` is the boundary. `engine/` is framework-free and never
imports React or the store. `components/` carry no FHIR logic — they render from a
`NormalizedItem` plus store state, and read enabled/error/score purely through store
selectors.

The payoff: FHIR's messiness is isolated in one exhaustively-tested layer, all form logic
stays pure and unit-testable, and the component layer is free to focus entirely on
accessibility.

## Tech stack

- **React 19** + **TypeScript** (strict, including `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`) + **Vite**
- **react-aria-components** for accessible primitives — radio groups, selects, sliders,
  comboboxes, date pickers. Not hand-rolled, not Radix.
- **Zustand** for state, normalized by `linkId`. Not React Hook Form.
- **fhirpath** for scoring (`weight()` for item weights, `calculatedExpression` evaluation)
- **Tailwind CSS v4**
- **Vitest** + Testing Library + jsdom for unit and component tests
- **Playwright** + axe-core for end-to-end and accessibility sweeps

## Project structure

```
src/
  parser/       types.ts, parseQuestionnaire.ts          FHIR -> NormalizedItem
  engine/       enableWhen.ts, validation.ts, scoring.ts, qr.ts
  store/        useFormStore.ts
  components/    QuestionnaireForm.tsx, QuestionnaireItem.tsx, fields/
  fixtures/     phq9.json, kitchen-sink.json, ...
  App.tsx
```

No barrel files — imports come straight from the source module.

## Getting started

Requires **Node 20+** and **pnpm**.

```bash
pnpm install
pnpm dev
```

### Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Type-check (`tsc -b`) + production build to `dist/` |
| `pnpm preview` | Preview the production build |
| `pnpm test` | Vitest (watch) |
| `pnpm test:run` | Vitest (single run) |
| `pnpm test:e2e` | Playwright (builds + previews, then runs `e2e/`) |
| `pnpm format` | Prettier `--write .` |

## Testing & accessibility

Accessibility is treated as a functional requirement:

- Choice groups use `fieldset` / `legend`; every field has a programmatic label, with help
  text and errors wired via `aria-describedby`, plus `aria-invalid` and `aria-required`.
- On a failed submit, an error summary lists each error as an in-page link and moves focus to
  itself.
- `enableWhen` changes are announced through an `aria-live` region, so screen-reader users
  never silently gain or lose fields.
- Everything is fully keyboard-operable, with a visible focus indicator on every control.

On the testing side: `parser/` and `engine/` are pure and exhaustively unit-tested (truth
tables for `enableWhen`, known totals for scoring); rendering components get Testing Library
behavior tests and must pass an axe sweep.
