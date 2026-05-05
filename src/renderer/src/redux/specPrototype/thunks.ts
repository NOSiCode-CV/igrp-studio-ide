import type { Dispatch } from '@reduxjs/toolkit'
import {
    protoActiveFileCleared,
    protoActiveFileLoadStart,
    protoActiveFileLoaded,
    protoDevStatus,
    protoError,
    protoFilesReplaced,
    protoLogAppended,
    protoLogsReplaced,
    protoSnapshotsReplaced
} from './reducer'

export const loadPrototypeFiles =
    (basePath: string) => async (dispatch: Dispatch) => {
        if (!basePath) return
        try {
            const files = await window.specPrototype.listFiles(basePath)
            dispatch(protoFilesReplaced(files))
        } catch (err) {
            dispatch(protoError(err instanceof Error ? err.message : String(err)))
        }
    }

export const openPrototypeFile =
    (basePath: string, path: string) => async (dispatch: Dispatch) => {
        if (!basePath || !path) return
        dispatch(protoActiveFileLoadStart(path))
        try {
            const result = await window.specPrototype.readFile(basePath, path)
            if (result) dispatch(protoActiveFileLoaded({ path, content: result.content }))
            else dispatch(protoActiveFileCleared())
        } catch (err) {
            dispatch(protoError(err instanceof Error ? err.message : String(err)))
            dispatch(protoActiveFileCleared())
        }
    }

export const refreshDevStatus =
    (basePath: string) => async (dispatch: Dispatch) => {
        if (!basePath) return
        try {
            const status = await window.specPrototype.devStatus(basePath)
            dispatch(protoDevStatus(status))
        } catch (err) {
            dispatch(protoError(err instanceof Error ? err.message : String(err)))
        }
    }

export const startPrototypeDev =
    (basePath: string) => async (dispatch: Dispatch) => {
        if (!basePath) return
        try {
            const status = await window.specPrototype.startDev(basePath)
            dispatch(protoDevStatus(status))
            const buffer = await window.specPrototype.getDevLogBuffer(basePath, 200)
            dispatch(protoLogsReplaced(buffer))
            return status
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            dispatch(protoError(message))
            // Surface the error in the log stream so the Logs tab makes sense.
            dispatch(
                protoLogAppended({
                    timestamp: Date.now(),
                    level: 'error',
                    line: `[start-dev] ${message}`
                })
            )
            return null
        }
    }

export const stopPrototypeDev =
    (basePath: string) => async (dispatch: Dispatch) => {
        if (!basePath) return
        try {
            const status = await window.specPrototype.stopDev(basePath)
            dispatch(protoDevStatus(status))
        } catch (err) {
            dispatch(protoError(err instanceof Error ? err.message : String(err)))
        }
    }

export const loadPrototypeSnapshots =
    (basePath: string) => async (dispatch: Dispatch) => {
        if (!basePath) return
        try {
            const snapshots = await window.specPrototype.listSnapshots(basePath)
            dispatch(protoSnapshotsReplaced(snapshots))
        } catch (err) {
            dispatch(protoError(err instanceof Error ? err.message : String(err)))
        }
    }

export const restorePrototypeSnapshot =
    (basePath: string, sha: string) => async (dispatch: Dispatch) => {
        if (!basePath || !sha) return
        try {
            await window.specPrototype.restoreSnapshot(basePath, sha)
            // Refresh tree + snapshots so the UI reflects the rollback.
            const [files, snapshots] = await Promise.all([
                window.specPrototype.listFiles(basePath),
                window.specPrototype.listSnapshots(basePath)
            ])
            dispatch(protoFilesReplaced(files))
            dispatch(protoSnapshotsReplaced(snapshots))
        } catch (err) {
            dispatch(protoError(err instanceof Error ? err.message : String(err)))
        }
    }

/**
 * Mounts global subscribers for prototype events. Should be invoked once at
 * store boot — returns an unsubscribe.
 */
export const subscribePrototypeEvents = () => (dispatch: Dispatch): (() => void) => {
    const offLog = window.specPrototype.onDevLog(({ entry }) => {
        dispatch(protoLogAppended(entry))
    })
    const offStatus = window.specPrototype.onDevStatus(({ status }) => {
        dispatch(protoDevStatus(status))
    })
    return () => {
        offLog()
        offStatus()
    }
}
