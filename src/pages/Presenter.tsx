import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PROJECTS, getProject, type DemoId } from '../app/navigation/projects'
import {
  addContribution,
  deleteContribution,
  replaceAllContributions,
  setContributionStatus,
  updateContribution,
} from '../contributions/store'
import { STATUS_LABEL, type Contribution, type ContributionStatus } from '../contributions/types'
import { useContributions } from '../contributions/useContributions'

const STATUSES: ContributionStatus[] = ['proposed', 'in-progress', 'accepted']
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })

/**
 * Presenter-only panel (no auth; this app only runs on the presenter's laptop).
 * Record proposed ideas, mark them in progress, accept them, fix mistakes.
 * Open it in a second tab/window: the student screen updates live.
 */
export function Presenter() {
  const all = useContributions()
  const list = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const counts = {
    accepted: all.filter((c) => c.status === 'accepted').length,
    inProgress: all.filter((c) => c.status === 'in-progress').length,
    proposed: all.filter((c) => c.status === 'proposed').length,
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-8 py-8">
      <header className="flex flex-wrap items-center gap-4">
        <Link to="/" className="btn btn-secondary text-base">
          ← Menu
        </Link>
        <h1 className="text-3xl font-black">🎛️ Presenter controls</h1>
        <div className="ml-auto flex gap-3 text-sm font-bold">
          <span className="rounded-full bg-lime-400/20 px-3 py-1 text-lime-300">{counts.accepted} accepted</span>
          <span className="rounded-full bg-amber-400/20 px-3 py-1 text-amber-300">{counts.inProgress} building</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">{counts.proposed} proposed</span>
          <Link to="/evolution" className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20">
            🧬 Evolution
          </Link>
        </div>
      </header>

      <NewContributionForm />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-black text-white/80">All entries ({list.length})</h2>
        {list.length === 0 && <p className="text-white/50">Nothing recorded yet.</p>}
        {list.map((c) => (
          <ContributionRow key={c.id} c={c} />
        ))}
      </section>

      <BackupTools all={all} />
    </div>
  )
}

function NewContributionForm() {
  const [demo, setDemo] = useState<DemoId>('reality-hacker')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [alias, setAlias] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  const submit = (status: ContributionStatus) => (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addContribution({ demo, title: title.trim(), description: description.trim(), alias: alias.trim() || undefined, status })
    setTitle('')
    setDescription('')
    setAlias('')
    titleRef.current?.focus()
  }

  return (
    <form className="grid gap-3 rounded-3xl bg-white/5 p-6 md:grid-cols-2" onSubmit={submit('proposed')}>
      <h2 className="text-xl font-black md:col-span-2">Record an idea</h2>
      <select className="input" value={demo} onChange={(e) => setDemo(e.target.value as DemoId)}>
        {PROJECTS.map((p) => (
          <option key={p.id} value={p.id} className="text-black">
            {p.emoji} {p.name}
          </option>
        ))}
      </select>
      <input
        ref={titleRef}
        className="input"
        placeholder="Short title, e.g. Chicken Cannon"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        className="input md:col-span-2"
        placeholder="What changed? e.g. Replaced laser effects with flying cartoon chickens."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        className="input"
        placeholder="Student nickname (optional, no real names)"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
      />
      <div className="flex gap-2">
        <button type="submit" className="btn btn-secondary flex-1">
          💡 Save as proposed
        </button>
        <button type="button" className="btn btn-primary flex-1" onClick={submit('accepted')}>
          ✅ Save as accepted
        </button>
      </div>
    </form>
  )
}

function ContributionRow({ c }: { c: Contribution }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(c.title)
  const [description, setDescription] = useState(c.description)
  const [alias, setAlias] = useState(c.alias ?? '')
  const [demo, setDemo] = useState<DemoId>(c.demo)
  const p = getProject(c.demo)

  const save = () => {
    updateContribution(c.id, { title: title.trim() || c.title, description: description.trim(), alias: alias.trim() || undefined, demo })
    setEditing(false)
  }
  const remove = () => {
    if (window.confirm(`Delete "${c.title}"?`)) deleteContribution(c.id)
  }

  const statusColor =
    c.status === 'accepted' ? 'bg-lime-400/20 text-lime-300' : c.status === 'in-progress' ? 'bg-amber-400/20 text-amber-300' : 'bg-white/10 text-white/70'

  return (
    <div className="rounded-2xl bg-white/5 p-4">
      {editing ? (
        <div className="grid gap-2 md:grid-cols-2">
          <select className="input" value={demo} onChange={(e) => setDemo(e.target.value as DemoId)}>
            {PROJECTS.map((x) => (
              <option key={x.id} value={x.id} className="text-black">
                {x.emoji} {x.name}
              </option>
            ))}
          </select>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="input md:col-span-2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          <input className="input" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Nickname" />
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1" onClick={save}>
              Save
            </button>
            <button className="btn btn-secondary flex-1" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl">{p.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-lg font-black">{c.title}</span>
              <span className="text-xs font-bold" style={{ color: p.accent }}>
                {p.name}
              </span>
              {c.alias && <span className="text-xs text-white/50">by {c.alias}</span>}
              <span className="text-xs text-white/40">
                {timeFmt.format(new Date(c.createdAt))}
                {c.acceptedAt ? ` → accepted ${timeFmt.format(new Date(c.acceptedAt))}` : ''}
              </span>
            </div>
            {c.description && <div className="text-sm text-white/70">{c.description}</div>}
          </div>
          <select
            className={`rounded-full px-3 py-1 text-sm font-bold ${statusColor}`}
            value={c.status}
            onChange={(e) => setContributionStatus(c.id, e.target.value as ContributionStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="text-black">
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          {c.status !== 'accepted' && (
            <button className="btn btn-primary px-3 py-1 text-sm" onClick={() => setContributionStatus(c.id, 'accepted')}>
              ✅ Accept
            </button>
          )}
          <button className="btn btn-secondary px-3 py-1 text-sm" onClick={() => setEditing(true)}>
            ✏️
          </button>
          <button className="btn btn-danger px-3 py-1 text-sm" onClick={remove}>
            🗑
          </button>
        </div>
      )}
    </div>
  )
}

/** Download / restore the history as JSON (localStorage is not version control). */
function BackupTools({ all }: { all: Contribution[] }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const download = () => {
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `contributions-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const restore = async (file: File | undefined) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as Contribution[]
      if (!Array.isArray(parsed)) throw new Error('not a list')
      if (window.confirm(`Replace ${all.length} entries with ${parsed.length} from the file?`)) replaceAllContributions(parsed)
    } catch (err) {
      window.alert(`Could not read that file: ${(err as Error).message}`)
    }
    if (fileRef.current) fileRef.current.value = ''
  }
  return (
    <section className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/5 p-4 text-sm text-white/60">
      <span>Backup (history lives in this browser's localStorage):</span>
      <button className="btn btn-secondary px-3 py-1 text-sm" onClick={download}>
        ⬇ Download JSON
      </button>
      <label className="btn btn-secondary px-3 py-1 text-sm">
        ⬆ Restore JSON
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => restore(e.target.files?.[0])} />
      </label>
    </section>
  )
}
