import { useSyncExternalStore } from 'react'

export type FolderStyle = 'original' | 'solid' | 'neutral' | 'glossy' | 'paper' | 'outline'

export const FOLDER_STYLES: { key: FolderStyle; label: string }[] = [
  { key: 'original', label: 'Original' },
  { key: 'solid', label: 'Solid' },
  { key: 'neutral', label: 'Neutral' },
  { key: 'glossy', label: 'Glossy' },
  { key: 'paper', label: 'Paper' },
  { key: 'outline', label: 'Outline' },
]

const KEY = 'folder-style'
const EVENT = 'folder-style-change'

function read(): FolderStyle {
  const saved = localStorage.getItem(KEY)
  return FOLDER_STYLES.some(s => s.key === saved) ? (saved as FolderStyle) : 'original'
}

export function setFolderStyle(style: FolderStyle) {
  localStorage.setItem(KEY, style)
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback)
  return () => window.removeEventListener(EVENT, callback)
}

export function useFolderStyle() {
  return useSyncExternalStore(subscribe, read)
}
