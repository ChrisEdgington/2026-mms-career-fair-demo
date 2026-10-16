interface Props {
  active: boolean
  activeLabel: string
  idleLabel: string
  color?: string
}

/** Small glowing status indicator, e.g. "Face detected" / "Looking for a face…". */
export function StatusPill({ active, activeLabel, idleLabel, color = '#b6ff3d' }: Props) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-base font-bold">
      <span
        className={`h-3 w-3 rounded-full ${active ? 'pulse-ring' : ''}`}
        style={{ background: active ? color : '#666' }}
      />
      {active ? activeLabel : idleLabel}
    </div>
  )
}
