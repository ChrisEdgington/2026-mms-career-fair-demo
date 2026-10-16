// The four demos. Add a demo here and in App.tsx routes to register a new one.
export type DemoId = 'reality-hacker' | 'boss-battle' | 'motion-lab' | 'rock-paper-scissors'

export interface Project {
  id: DemoId
  name: string
  path: string
  emoji: string
  tagline: string
  /** Tailwind gradient classes for the landing card. */
  gradient: string
  /** Accent color used for status pills, etc. */
  accent: string
}

export const PROJECTS: Project[] = [
  {
    id: 'reality-hacker',
    name: 'Reality Hacker',
    path: '/reality-hacker',
    emoji: '🪞',
    tagline: 'The webcam sees your face. Tell us what to do to it.',
    gradient: 'from-fuchsia-500 via-pink-500 to-orange-400',
    accent: '#ff3d8e',
  },
  {
    id: 'boss-battle',
    name: 'Boss Battle',
    path: '/boss-battle',
    emoji: '👾',
    tagline: 'Fight a boss with your bare hands. Literally.',
    gradient: 'from-violet-600 via-purple-500 to-blue-500',
    accent: '#a855f7',
  },
  {
    id: 'motion-lab',
    name: 'Motion Lab',
    path: '/motion-lab',
    emoji: '🕺',
    tagline: 'Your body becomes the controller. What should it control?',
    gradient: 'from-cyan-400 via-sky-500 to-blue-600',
    accent: '#22e6ff',
  },
  {
    id: 'rock-paper-scissors',
    name: 'Rock Paper Scissors',
    path: '/rock-paper-scissors',
    emoji: '✌️',
    tagline: 'Beat the computer with real hand gestures.',
    gradient: 'from-lime-400 via-emerald-400 to-teal-500',
    accent: '#b6ff3d',
  },
]

export function getProject(id: DemoId): Project {
  const p = PROJECTS.find((x) => x.id === id)
  if (!p) throw new Error(`Unknown project: ${id}`)
  return p
}
