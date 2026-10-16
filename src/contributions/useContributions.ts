import { useSyncExternalStore } from 'react'
import { acceptedContributions, getContributions, subscribeContributions } from './store'
import type { Contribution } from './types'
import type { DemoId } from '../app/navigation/projects'

/** Live list of all contributions (re-renders on any change, including other tabs). */
export function useContributions(): Contribution[] {
  return useSyncExternalStore(subscribeContributions, getContributions)
}

/** Accepted contributions, newest first, optionally for one demo. */
export function useAcceptedContributions(demo?: DemoId): Contribution[] {
  const all = useContributions()
  const accepted = acceptedContributions(all)
  return demo ? accepted.filter((c) => c.demo === demo) : accepted
}
