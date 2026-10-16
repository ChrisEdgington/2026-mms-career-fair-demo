import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  name: string
  children: ReactNode
}
interface State {
  error: Error | null
  resetKey: number
}

/**
 * Catches render/runtime errors inside one demo so the rest of the app keeps
 * working. "Try again" remounts the demo; "Back to menu" leaves it.
 */
export class DemoErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: 0 }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.name}] crashed`, error, info.componentStack)
  }

  reset = () => this.setState((s) => ({ error: null, resetKey: s.resetKey + 1 }))

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-10 text-center">
          <div className="text-7xl">💥</div>
          <h1 className="text-4xl font-black">{this.props.name} hit a bug</h1>
          <pre className="max-w-3xl overflow-auto rounded-xl bg-white/10 p-4 text-left text-sm text-red-200">
            {this.state.error.message}
          </pre>
          <p className="text-white/60">That's software engineering. Let's fix it.</p>
          <div className="flex gap-4">
            <button className="btn btn-primary" onClick={this.reset}>
              Try again
            </button>
            <Link to="/" className="btn btn-secondary">
              Back to menu
            </Link>
          </div>
        </div>
      )
    }
    return <div key={this.state.resetKey}>{this.props.children}</div>
  }
}
