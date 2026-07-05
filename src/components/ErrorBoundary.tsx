import { Component, type ReactElement, type ReactNode } from 'react'
import { cardClass, secondaryButtonClass } from './styles'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

// React error boundaries are only expressible as a class component
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  override componentDidCatch(error: unknown): void {
    console.error('Questionnaire render failed', error)
  }

  override render(): ReactElement | ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <div role="alert" className={cardClass}>
        <h2 className="text-lg font-semibold text-ink">Something went wrong</h2>
        <p className="mt-2 text-ink-muted">
          This questionnaire could not be displayed. Your other forms are
          unaffected — reloading the page usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={`mt-4 ${secondaryButtonClass} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`}
        >
          Reload page
        </button>
      </div>
    )
  }
}
