'use client'

import {
    IGRPButtonPrimitive,
    IGRPSeparator
} from '@igrp/igrp-framework-react-design-system'
import { Eraser, Plus, Terminal as TerminalIcon, X } from 'lucide-react'
import { SearchAddon } from '@xterm/addon-search'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { type JSX, useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '../routes/routeConstants'

const DEFAULT_PANEL_HEIGHT = 300
const MIN_PANEL_HEIGHT = 200
const MAX_PANEL_HEIGHT_RATIO = 0.75

export const TERMINAL_TOGGLE_EVENT = 'igrp-studio:terminal-toggle'
type TerminalSession = { id: string; title: string }
type TerminalContextMenu = { sessionId: string; x: number; y: number }
type RootState = {
    PageBuilder: {
        basePath: string
        workspace: { path?: string } | null
    }
}

const createSessionId = (): string =>
    `terminal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const createSession = (labelNumber: number): TerminalSession => ({
    id: createSessionId(),
    title: `Terminal ${labelNumber}`
})

export function IntegratedTerminal(): JSX.Element {
    const firstSession = createSession(1)
    const location = useLocation()
    const { basePath, workspacePath } = useSelector((state: RootState) => ({
        basePath: state.PageBuilder.basePath,
        workspacePath: state.PageBuilder.workspace?.path ?? ''
    }))
    const [isOpen, setIsOpen] = useState(false)
    const [panelHeight, setPanelHeight] = useState(DEFAULT_PANEL_HEIGHT)
    const [isResizing, setIsResizing] = useState(false)
    const [sessions, setSessions] = useState<TerminalSession[]>(() => [firstSession])
    const [activeSessionId, setActiveSessionId] = useState<string>(firstSession.id)
    const [contextMenu, setContextMenu] = useState<TerminalContextMenu | null>(null)
    const sessionCounterRef = useRef(1)
    const panelRef = useRef<HTMLDivElement>(null)
    const hostRefs = useRef<Map<string, HTMLDivElement>>(new Map())
    const sessionRefs = useRef<
        Map<string, { terminal: Terminal; fitAddon: FitAddon; initialized: boolean }>
    >(new Map())
    const cleanupResizeObserverRef = useRef<(() => void) | null>(null)
    const cleanupOnDataRef = useRef<(() => void) | null>(null)
    const cleanupOnExitRef = useRef<(() => void) | null>(null)

    const fitActiveTerminal = useCallback(() => {
        if (!activeSessionId) return
        const sessionRef = sessionRefs.current.get(activeSessionId)
        if (!sessionRef) return

        sessionRef.fitAddon.fit()
        const { cols, rows } = sessionRef.terminal
        if (cols > 0 && rows > 0) {
            window.terminal.resize(activeSessionId, cols, rows)
        }
    }, [activeSessionId])

    const resolveSessionCwd = useCallback((): string | undefined => {
        const pathname = location.pathname
        const isHomeContext =
            pathname === '/' ||
            pathname === ROUTES.IDE_INITIAL_SCREEN ||
            pathname === ROUTES.HOME

        if (isHomeContext) {
            return workspacePath || basePath || undefined
        }

        return basePath || workspacePath || undefined
    }, [basePath, location.pathname, workspacePath])

    const createNewTerminal = useCallback(() => {
        const nextCounter = sessionCounterRef.current + 1
        sessionCounterRef.current = nextCounter
        const nextSession = createSession(nextCounter)
        setSessions((previousSessions) => [...previousSessions, nextSession])
        setActiveSessionId(nextSession.id)
    }, [])

    const clearActiveTerminal = useCallback(() => {
        if (!activeSessionId) return
        const sessionRef = sessionRefs.current.get(activeSessionId)
        if (!sessionRef) return
        sessionRef.terminal.clear()
        sessionRef.terminal.write('\x1b[2J\x1b[3J\x1b[H')
    }, [activeSessionId])

    const registerTerminalHost = useCallback((sessionId: string, element: HTMLDivElement | null) => {
        if (!element) {
            hostRefs.current.delete(sessionId)
            return
        }
        hostRefs.current.set(sessionId, element)
    }, [])

    const closeSession = useCallback(
        (sessionId: string) => {
            setContextMenu(null)
            const sessionRef = sessionRefs.current.get(sessionId)
            if (sessionRef) {
                sessionRef.terminal.dispose()
                sessionRefs.current.delete(sessionId)
            }
            hostRefs.current.delete(sessionId)
            window.terminal.destroy(sessionId)

            setSessions((previousSessions) => {
                const filteredSessions = previousSessions.filter((session) => session.id !== sessionId)
                if (filteredSessions.length === 0) {
                    const nextCounter = sessionCounterRef.current + 1
                    sessionCounterRef.current = nextCounter
                    const fallback = createSession(nextCounter)
                    setActiveSessionId(fallback.id)
                    return [fallback]
                }

                if (activeSessionId === sessionId) {
                    const nextActive =
                        filteredSessions[filteredSessions.length - 1] ?? filteredSessions[0]
                    setActiveSessionId(nextActive.id)
                }

                return filteredSessions
            })
        },
        [activeSessionId]
    )

    useEffect(() => {
        const onToggle = (): void => {
            setIsOpen((previous) => !previous)
            setContextMenu(null)
        }

        const onShortcut = (event: KeyboardEvent): void => {
            const pressedBacktick = event.code === 'Backquote' || event.key === '`'
            const hasModifier = event.ctrlKey || event.metaKey
            if (!pressedBacktick || !hasModifier) return
            event.preventDefault()
            setIsOpen((previous) => !previous)
            setTimeout(() => fitActiveTerminal(), 0)
        }

        window.addEventListener(TERMINAL_TOGGLE_EVENT, onToggle)
        window.addEventListener('keydown', onShortcut)

        return () => {
            window.removeEventListener(TERMINAL_TOGGLE_EVENT, onToggle)
            window.removeEventListener('keydown', onShortcut)
        }
    }, [fitActiveTerminal])

    useEffect(() => {
        if (!contextMenu) return
        const closeContextMenu = (): void => {
            setContextMenu(null)
        }

        window.addEventListener('click', closeContextMenu)
        window.addEventListener('blur', closeContextMenu)

        return () => {
            window.removeEventListener('click', closeContextMenu)
            window.removeEventListener('blur', closeContextMenu)
        }
    }, [contextMenu])

    useEffect(() => {
        if (!isOpen) return

        for (const session of sessions) {
            const sessionHost = hostRefs.current.get(session.id)
            if (!sessionHost) continue
            if (sessionRefs.current.has(session.id)) continue

            const terminal = new Terminal({
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                fontSize: 13,
                lineHeight: 1.2,
                cursorBlink: true,
                theme: {
                    background: '#1e1e1e',
                    foreground: '#d4d4d4'
                }
            })

            const fitAddon = new FitAddon()
            const linksAddon = new WebLinksAddon()
            const searchAddon = new SearchAddon()

            terminal.loadAddon(fitAddon)
            terminal.loadAddon(linksAddon)
            terminal.loadAddon(searchAddon)
            terminal.open(sessionHost)

            sessionRefs.current.set(session.id, { terminal, fitAddon, initialized: false })

            terminal.onData((data) => {
                window.terminal.send(session.id, data)
            })

            terminal.onResize(({ cols, rows }) => {
                window.terminal.resize(session.id, cols, rows)
            })

            window.terminal.create(session.id, resolveSessionCwd())
        }
    }, [isOpen, resolveSessionCwd, sessions])

    useEffect(() => {
        if (!isOpen) return
        if (!activeSessionId) return
        fitActiveTerminal()
    }, [activeSessionId, fitActiveTerminal, isOpen])

    useEffect(() => {
        cleanupOnDataRef.current?.()
        cleanupOnExitRef.current?.()

        cleanupOnDataRef.current = window.terminal.onData(({ sessionId, data }) => {
            const sessionRef = sessionRefs.current.get(sessionId)
            if (!sessionRef) return

            if (!sessionRef.initialized) {
                sessionRef.fitAddon.fit()
                const { cols, rows } = sessionRef.terminal
                if (cols > 0 && rows > 0) {
                    window.terminal.resize(sessionId, cols, rows)
                }
                sessionRef.initialized = true
            }
            sessionRef.terminal.write(data)
        })

        cleanupOnExitRef.current = window.terminal.onExit(({ sessionId }) => {
            const sessionRef = sessionRefs.current.get(sessionId)
            if (!sessionRef) return
            sessionRef.terminal.writeln('\r\n[process exited]')
        })

        const observer = new ResizeObserver(() => {
            fitActiveTerminal()
        })
        if (panelRef.current) {
            observer.observe(panelRef.current)
        }
        cleanupResizeObserverRef.current = () => observer.disconnect()

        const onWindowResize = (): void => {
            fitActiveTerminal()
        }

        window.addEventListener('resize', onWindowResize)

        return () => {
            window.removeEventListener('resize', onWindowResize)
            cleanupResizeObserverRef.current?.()
            cleanupResizeObserverRef.current = null
            cleanupOnDataRef.current?.()
            cleanupOnDataRef.current = null
            cleanupOnExitRef.current?.()
            cleanupOnExitRef.current = null
        }
    }, [fitActiveTerminal])

    useEffect(() => {
        return () => {
            for (const [sessionId, sessionRef] of sessionRefs.current.entries()) {
                window.terminal.destroy(sessionId)
                sessionRef.terminal.dispose()
            }
            sessionRefs.current.clear()
        }
    }, [])

    useEffect(() => {
        if (!isResizing) return

        const onMouseMove = (event: MouseEvent): void => {
            const nextHeight = window.innerHeight - event.clientY - 32
            const maxHeight = Math.floor(window.innerHeight * MAX_PANEL_HEIGHT_RATIO)
            setPanelHeight(Math.max(MIN_PANEL_HEIGHT, Math.min(nextHeight, maxHeight)))
        }

        const onMouseUp = (): void => {
            setIsResizing(false)
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)

        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
    }, [isResizing])

    if (!isOpen) return <></>

    return (
        <div
            ref={panelRef}
            className="fixed bottom-8 left-0 right-0 z-40 border-t bg-[#1e1e1e] text-[#d4d4d4] flex flex-col"
            style={{ height: `${panelHeight}px`, minHeight: `${MIN_PANEL_HEIGHT}px` }}
        >
            <button
                type="button"
                aria-label="Resize terminal panel"
                className="h-2 cursor-row-resize bg-[#232323] hover:bg-[#2a2a2a]"
                onMouseDown={() => setIsResizing(true)}
            />

            <div className="h-10 px-3 border-b border-[#2a2a2a] flex items-center justify-between">
                <div className="h-full flex items-center gap-2 overflow-x-auto">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className={`h-full px-3 text-xs flex items-center gap-2 border-b ${
                                session.id === activeSessionId
                                    ? 'border-primary text-[#d4d4d4]'
                                    : 'border-transparent text-[#9f9f9f]'
                            }`}
                        >
                            <button
                                type="button"
                                className="h-full flex items-center gap-2"
                                onClick={() => {
                                    setActiveSessionId(session.id)
                                    setTimeout(() => fitActiveTerminal(), 0)
                                }}
                                onContextMenu={(event) => {
                                    event.preventDefault()
                                    setActiveSessionId(session.id)
                                    setContextMenu({
                                        sessionId: session.id,
                                        x: event.clientX,
                                        y: event.clientY
                                    })
                                }}
                            >
                                <TerminalIcon className="h-3.5 w-3.5" />
                                {session.title}
                            </button>
                            {sessions.length > 1 && (
                                <button
                                    type="button"
                                    className="rounded-sm hover:bg-[#2a2a2a] p-0.5"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        closeSession(session.id)
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key !== 'Enter' && event.key !== ' ') return
                                        event.preventDefault()
                                        closeSession(session.id)
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex items-center">
                    <IGRPButtonPrimitive
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#d4d4d4] hover:bg-[#2a2a2a]"
                        onClick={clearActiveTerminal}
                    >
                        <Eraser className="h-4 w-4" />
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#d4d4d4] hover:bg-[#2a2a2a]"
                        onClick={createNewTerminal}
                    >
                        <Plus className="h-4 w-4" />
                    </IGRPButtonPrimitive>
                    <IGRPSeparator orientation="vertical" className="h-4 bg-[#2a2a2a]" />
                    <IGRPButtonPrimitive
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-2 text-[#d4d4d4] hover:bg-[#2a2a2a]"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </IGRPButtonPrimitive>
                </div>
            </div>

            <div className="flex-1 px-2 py-1 overflow-hidden">
                {sessions.map((session) => (
                    <div
                        key={session.id}
                        ref={(element) => registerTerminalHost(session.id, element)}
                        className={session.id === activeSessionId ? 'h-full w-full' : 'hidden'}
                    />
                ))}
            </div>

            {contextMenu ? (
                <div
                    className="fixed z-50 min-w-40 border border-[#2a2a2a] bg-[#1b1b1b] rounded-md shadow-lg p-1"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <button
                        type="button"
                        className="w-full text-left text-xs px-2 py-1.5 rounded-sm hover:bg-[#2a2a2a] text-[#d4d4d4]"
                        onClick={() => closeSession(contextMenu.sessionId)}
                    >
                        Kill Terminal
                    </button>
                </div>
            ) : null}
        </div>
    )
}

