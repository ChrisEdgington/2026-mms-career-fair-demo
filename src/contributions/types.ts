import type { DemoId } from '../app/navigation/projects'

export type ContributionStatus = 'proposed' | 'in-progress' | 'accepted'

export interface Contribution {
  id: string
  demo: DemoId
  title: string
  description: string
  /** Optional student nickname / alias. Never a real name. */
  alias?: string
  status: ContributionStatus
  /** ISO timestamps */
  createdAt: string
  acceptedAt?: string
}

export const STATUS_LABEL: Record<ContributionStatus, string> = {
  proposed: 'Proposed',
  'in-progress': 'Building…',
  accepted: 'Accepted',
}
