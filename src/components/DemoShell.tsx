import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getProject, type DemoId } from '../app/navigation/projects'
import { RecentImprovements } from '../contributions/RecentImprovements'

interface Props {
  demo: DemoId
  /** Status pills / small controls shown in the header. */
  status?: ReactNode
  /** Short instruction line under the title. */
  hint?: string
  children: ReactNode
}

/**
 * Common frame for every demo: title, back button, status area, and a tiny
 * list of accepted improvements for this demo.
 */
export function DemoShell({ demo, status, hint, children }: Props) {
  const project = getProject(demo)
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-4 px-6 py-4">
        <Link to="/" className="btn btn-secondary text-base">
          ← Menu
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{project.emoji}</span>
          <div>
            <h1 className="text-3xl font-black leading-tight">{project.name}</h1>
            {hint && <p className="text-sm text-white/60">{hint}</p>}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">{status}</div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-6">{children}</main>
      <RecentImprovements demo={demo} />
    </div>
  )
}
