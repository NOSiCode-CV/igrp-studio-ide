import fs from 'fs'
import path from 'path'

export interface WatchEvent {
  eventType: string
  filename: string
  fullPath: string
  timestamp: number
}

export interface WatchResult {
  success?: boolean
  error?: string
}

export class FolderWatcher {
  private watchers: Map<string, fs.FSWatcher>

  constructor() {
    this.watchers = new Map()
  }

  watchFolder(folderPath: string, callback: (event: WatchEvent) => void): WatchResult {
    if (this.watchers.has(folderPath)) {
      return { error: 'This folder is already being watched' }
    }

    try {
      const watcher = fs.watch(folderPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return

        const fullPath = path.join(folderPath, filename)

        callback({
          eventType,
          filename,
          fullPath,
          timestamp: Date.now()
        })
      })

      this.watchers.set(folderPath, watcher)
      return { success: true }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  stopWatching(folderPath: string): WatchResult {
    const watcher = this.watchers.get(folderPath)
    if (watcher) {
      watcher.close()
      this.watchers.delete(folderPath)
      return { success: true }
    }
    return { error: 'No watcher found for this folder' }
  }

  stopAll(): void {
    this.watchers.forEach((watcher) => watcher.close())
    this.watchers.clear()
  }
}

export const folderWatcher = new FolderWatcher()
