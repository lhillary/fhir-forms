import type { NormalizedItem } from '../parser/types'

// Test-only factory for NormalizedItem with sensible defaults
export function makeItem(
  overrides: Partial<NormalizedItem> & Pick<NormalizedItem, 'linkId' | 'type'>,
): NormalizedItem {
  return {
    required: false,
    repeats: false,
    readOnly: false,
    hidden: false,
    constraints: {},
    enableBehavior: 'any',
    children: [],
    ...overrides,
  }
}
