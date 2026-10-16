import type { DemoId } from '../app/navigation/projects'
import { useAcceptedContributions } from './useContributions'

/** Tiny footer strip on a demo page listing its latest accepted improvements. */
export function RecentImprovements({ demo, max = 3 }: { demo: DemoId; max?: number }) {
  const accepted = useAcceptedContributions(demo)
  if (accepted.length === 0) return null
  return (
    <footer className="flex flex-wrap items-center gap-3 px-6 pb-4 text-sm text-white/60">
      <span className="font-bold text-white/80">
        {accepted.length} student improvement{accepted.length === 1 ? '' : 's'}:
      </span>
      {accepted.slice(0, max).map((c) => (
        <span key={c.id} className="rounded-full bg-white/10 px-3 py-1">
          ✨ {c.title}
          {c.alias ? ` — ${c.alias}` : ''}
        </span>
      ))}
    </footer>
  )
}
