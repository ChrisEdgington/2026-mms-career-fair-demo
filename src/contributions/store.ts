/**
 * Contribution history persisted in localStorage.
 *
 * - Survives reloads.
 * - Other tabs of the same browser profile update live (the `storage` event).
 * - This is a record for the audience; Git is the real history of the code.
 */
import type { Contribution, ContributionStatus } from './types'

export const STORAGE_KEY = 'career-day.contributions.v1'

type Listener = () => void
const listeners = new Set<Listener>()
let cachedRaw: string | null = null
let cachedList: Contribution[] = []

function read(): Contribution[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    raw = null
  }
  if (raw === cachedRaw) return cachedList
  cachedRaw = raw
  try {
    const parsed = raw ? (JSON.parse(raw) as Contribution[]) : []
    cachedList = Array.isArray(parsed) ? parsed : []
  } catch {
    cachedList = []
  }
  return cachedList
}

function write(list: Contribution[]) {
  const raw = JSON.stringify(list)
  try {
    localStorage.setItem(STORAGE_KEY, raw)
  } catch (err) {
    console.error('could not save contributions', err)
  }
  cachedRaw = raw
  cachedList = list
  for (const l of listeners) l()
}

export function getContributions(): Contribution[] {
  return read()
}

export function subscribeContributions(listener: Listener): () => void {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function addContribution(
  input: Omit<Contribution, 'id' | 'createdAt' | 'acceptedAt'> & { acceptedAt?: string },
): Contribution {
  const now = new Date().toISOString()
  const c: Contribution = {
    ...input,
    id: newId(),
    createdAt: now,
    acceptedAt: input.status === 'accepted' ? (input.acceptedAt ?? now) : undefined,
  }
  write([...read(), c])
  return c
}

export function updateContribution(id: string, patch: Partial<Omit<Contribution, 'id'>>) {
  write(
    read().map((c) => {
      if (c.id !== id) return c
      const next = { ...c, ...patch }
      if (patch.status === 'accepted' && !next.acceptedAt) next.acceptedAt = new Date().toISOString()
      if (patch.status && patch.status !== 'accepted') next.acceptedAt = undefined
      return next
    }),
  )
}

export function setContributionStatus(id: string, status: ContributionStatus) {
  updateContribution(id, { status })
}

export function deleteContribution(id: string) {
  write(read().filter((c) => c.id !== id))
}

export function replaceAllContributions(list: Contribution[]) {
  write(list)
}

/** Accepted contributions, newest acceptance first. */
export function acceptedContributions(list: Contribution[] = read()): Contribution[] {
  return list
    .filter((c) => c.status === 'accepted')
    .sort((a, b) => (b.acceptedAt ?? b.createdAt).localeCompare(a.acceptedAt ?? a.createdAt))
}
