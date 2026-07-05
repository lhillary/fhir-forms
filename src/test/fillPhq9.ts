import { screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

export const PHQ9_QUESTIONS: readonly RegExp[] = [
  /Little interest or pleasure/,
  /Feeling down, depressed/,
  /Trouble falling or staying asleep/,
  /Feeling tired or having little energy/,
  /Poor appetite or overeating/,
  /Feeling bad about yourself/,
  /Trouble concentrating/,
  /Moving or speaking so slowly/,
  /Thoughts that you would be better off dead/,
]

export async function fillPhq9(
  user: UserEvent,
  optionText: string,
): Promise<void> {
  for (const question of PHQ9_QUESTIONS) {
    const group = screen.getByRole('radiogroup', { name: question })
    await user.click(within(group).getByText(optionText))
  }
}
