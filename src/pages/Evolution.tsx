import { Link } from 'react-router-dom'
import { PROJECTS, getProject } from '../app/navigation/projects'
import { useAcceptedContributions } from '../contributions/useContributions'

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })

/** Chronological record of accepted improvements, with totals per demo. */
export function Evolution() {
  const accepted = useAcceptedContributions() // newest first
  const chronological = [...accepted].reverse()

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-8 py-8">
      <header className="flex items-center gap-4">
        <Link to="/" className="btn btn-secondary text-base">
          ← Menu
        </Link>
        <h1 className="text-4xl font-black">🧬 How the software evolved today</h1>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-3xl bg-white/10 p-5 text-center">
          <div className="text-6xl font-black text-[var(--accent-lime)]">{accepted.length}</div>
          <div className="font-bold text-white/70">total improvements</div>
        </div>
        {PROJECTS.map((p) => {
          const n = accepted.filter((c) => c.demo === p.id).length
          return (
            <Link key={p.id} to={p.path} className={`rounded-3xl bg-gradient-to-br ${p.gradient} p-5 text-center`}>
              <div className="text-4xl">{p.emoji}</div>
              <div className="text-5xl font-black">{n}</div>
              <div className="font-bold text-white/90">{p.name}</div>
            </Link>
          )
        })}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-black text-white/80">Timeline</h2>
        {chronological.length === 0 ? (
          <p className="text-xl text-white/50">No accepted improvements yet. The software is still boring.</p>
        ) : (
          <ol className="relative ml-4 border-l-4 border-white/15 pl-8">
            {chronological.map((c, i) => {
              const p = getProject(c.demo)
              return (
                <li key={c.id} className="relative mb-8">
                  <span
                    className="absolute -left-[3.1rem] top-1 flex h-10 w-10 items-center justify-center rounded-full text-xl shadow-lg"
                    style={{ background: p.accent }}
                  >
                    {p.emoji}
                  </span>
                  <div className="rounded-2xl bg-white/5 p-5">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="text-sm font-bold text-white/40">#{i + 1}</span>
                      <h3 className="text-2xl font-black">{c.title}</h3>
                      <span className="text-sm font-bold" style={{ color: p.accent }}>
                        {p.name}
                      </span>
                      {c.alias && <span className="text-sm text-white/50">by {c.alias}</span>}
                      <span className="ml-auto text-sm text-white/40">
                        {timeFmt.format(new Date(c.acceptedAt ?? c.createdAt))}
                      </span>
                    </div>
                    {c.description && <p className="mt-2 text-lg text-white/80">{c.description}</p>}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </div>
  )
}
