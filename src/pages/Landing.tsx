import { Link } from 'react-router-dom'
import { PROJECTS, getProject } from '../app/navigation/projects'
import { useAcceptedContributions } from '../contributions/useContributions'

/**
 * The attract screen. Looks fun; the demos behind it deliberately don't (yet).
 */
export function Landing() {
  const accepted = useAcceptedContributions()

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* background color blobs */}
      <div className="blob left-[-10%] top-[-10%] h-[50vh] w-[50vh] bg-fuchsia-600" />
      <div className="blob right-[-10%] top-[20%] h-[55vh] w-[55vh] bg-cyan-500" style={{ animationDelay: '-6s' }} />
      <div className="blob bottom-[-15%] left-[30%] h-[50vh] w-[50vh] bg-lime-400" style={{ animationDelay: '-12s' }} />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-8 py-10">
        <header className="text-center">
          <h1 className="text-glow text-6xl font-black leading-none tracking-tight md:text-8xl">
            THIS SOFTWARE IS{' '}
            <span className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-orange-300 bg-clip-text text-transparent">
              BORING.
            </span>
          </h1>
          <h2 className="mt-4 text-4xl font-black md:text-6xl">
            HELP ME MAKE IT{' '}
            <span className="bg-gradient-to-r from-lime-300 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
              AWESOME.
            </span>
          </h2>
          <p className="mt-6 text-2xl font-bold text-white/80 md:text-3xl">
            Choose a project. Invent something. Watch it come to life.
          </p>
        </header>

        <section className="mt-10 grid flex-1 grid-cols-1 gap-6 md:grid-cols-2">
          {PROJECTS.map((p, i) => (
            <Link
              key={p.id}
              to={p.path}
              className={`group relative flex min-h-56 flex-col justify-end overflow-hidden rounded-[2rem] bg-gradient-to-br ${p.gradient} p-8 shadow-2xl transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="absolute right-6 top-4 text-[7rem] leading-none drop-shadow-xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                {p.emoji}
              </span>
              <span className="text-5xl font-black text-white drop-shadow-lg">{p.name}</span>
              <span className="mt-2 max-w-md text-xl font-semibold text-white/90">{p.tagline}</span>
            </Link>
          ))}
        </section>

        <section className="mt-8 flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-white/5 px-8 py-5">
          <div className="flex items-center gap-5">
            <div className="text-6xl font-black text-[var(--accent-lime)]">{accepted.length}</div>
            <div className="text-xl font-bold leading-tight text-white/80">
              student
              <br />
              improvement{accepted.length === 1 ? '' : 's'} today
            </div>
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {accepted.length === 0 ? (
              <span className="text-lg text-white/50">Nothing yet. Be the first to change this software!</span>
            ) : (
              accepted.slice(0, 5).map((c) => (
                <span key={c.id} className="rounded-full bg-white/10 px-4 py-2 text-base font-bold">
                  {getProject(c.demo).emoji} {c.title}
                  {c.alias ? <span className="text-white/50"> · {c.alias}</span> : null}
                </span>
              ))
            )}
          </div>
          <Link to="/evolution" className="btn btn-secondary">
            🧬 See the evolution
          </Link>
        </section>

        <footer className="mt-4 text-center text-sm text-white/30">
          <Link to="/presenter" className="hover:text-white/70">
            presenter
          </Link>
        </footer>
      </div>
    </div>
  )
}
