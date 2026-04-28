'use client'

import {
    IGRPButtonPrimitive,
    IGRPInputPrimitive,
    IGRPLabelPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { cn } from '@renderer/lib/utils'
import { CheckCircle2, Eye, EyeOff, FolderSearch, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { type FormEvent, type JSX, useEffect, useState } from 'react'

type Provider = 'openrouter' | 'openai' | 'voyage'

interface ProviderRow {
    id: Provider
    label: string
    description: string
    placeholder: string
}

const PROVIDERS: ProviderRow[] = [
    {
        id: 'openrouter',
        label: 'OpenRouter',
        description: 'Cloud LLMs (Claude, GPT, Gemini, Llama…) used by the AI Assistant.',
        placeholder: 'sk-or-v1-…'
    },
    {
        id: 'openai',
        label: 'OpenAI',
        description: 'Used by the Knowledge Base for semantic embeddings.',
        placeholder: 'sk-…'
    },
    {
        id: 'voyage',
        label: 'Voyage',
        description: 'Alternative embeddings provider (optional).',
        placeholder: 'pa-…'
    }
]

export function AIProvidersSettings(): JSX.Element {
    const [statuses, setStatuses] = useState<Record<Provider, boolean>>({
        openrouter: false,
        openai: false,
        voyage: false
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        window.specSettings
            .getSecretsStatus()
            .then((s) => {
                if (cancelled) return
                setStatuses(s)
                setLoading(false)
            })
            .catch(() => setLoading(false))
        return () => {
            cancelled = true
        }
    }, [])

    const refreshStatus = async () => {
        const next = await window.specSettings.getSecretsStatus()
        setStatuses(next)
    }

    return (
        <div className="space-y-6 p-1">
            <header>
                <h2 className="text-base font-semibold">AI Providers</h2>
                <p className="text-xs text-muted-foreground">
                    API keys are encrypted with the OS keychain (safeStorage). Environment
                    variables override stored values for development.
                </p>
            </header>

            {loading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                </div>
            ) : (
                <div className="space-y-4">
                    {PROVIDERS.map((p) => (
                        <ProviderCard
                            key={p.id}
                            provider={p}
                            configured={statuses[p.id]}
                            onChanged={refreshStatus}
                        />
                    ))}
                </div>
            )}

            <LocalCLIsCard />
        </div>
    )
}

type CLIStatus = { found: boolean; path?: string; version?: string; error?: string }
type CLIName = 'claude' | 'ollama'

function LocalCLIsCard(): JSX.Element {
    const [statuses, setStatuses] = useState<Record<CLIName, CLIStatus> | null>(null)
    const [paths, setPaths] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [draftPath, setDraftPath] = useState<Record<CLIName, string>>({
        claude: '',
        ollama: ''
    })

    const refresh = async () => {
        setLoading(true)
        try {
            const [next, prefs] = await Promise.all([
                window.specLLM.detectCLIs(),
                window.specSettings.getPreferences()
            ])
            setStatuses(next)
            setPaths(prefs.cliPaths ?? {})
            setDraftPath({
                claude: prefs.cliPaths?.claude ?? '',
                ollama: prefs.cliPaths?.ollama ?? ''
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
    }, [])

    const saveOverride = async (cli: CLIName, value: string) => {
        const trimmed = value.trim()
        const nextPaths = { ...paths }
        if (trimmed) nextPaths[cli] = trimmed
        else delete nextPaths[cli]
        await window.specSettings.setPreferences({ cliPaths: nextPaths })
        await refresh()
    }

    return (
        <div className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium">Local CLIs</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Detected automatically from your PATH. Set a custom path if the binary
                        lives outside the default lookup (e.g. <code>~/.claude/local/claude</code>).
                    </p>
                </div>
                <IGRPButtonPrimitive
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-[11px]"
                    onClick={refresh}
                    disabled={loading}
                >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Detecting…' : 'Re-detect'}
                </IGRPButtonPrimitive>
            </div>

            <div className="space-y-3">
                {(['claude', 'ollama'] as CLIName[]).map((cli) => {
                    const status = statuses?.[cli]
                    const ok = status?.found
                    return (
                        <div
                            key={cli}
                            className="rounded-md border bg-background p-3"
                        >
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-medium capitalize">{cli}</span>
                                {ok ? (
                                    <span className="flex items-center gap-1 text-emerald-600">
                                        <CheckCircle2 size={12} /> {status?.version}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <XCircle size={12} /> Not detected
                                    </span>
                                )}
                            </div>
                            {ok && status?.path && (
                                <p
                                    className="mt-1 truncate font-mono text-[10px] text-muted-foreground"
                                    title={status.path}
                                >
                                    {status.path}
                                </p>
                            )}
                            {!ok && status?.error && (
                                <p className="mt-1 text-[10px] text-red-500">{status.error}</p>
                            )}

                            <div className="mt-2 flex gap-2">
                                <IGRPInputPrimitive
                                    value={draftPath[cli]}
                                    onChange={(e) =>
                                        setDraftPath((prev) => ({
                                            ...prev,
                                            [cli]: e.target.value
                                        }))
                                    }
                                    placeholder={`Custom path for ${cli} (optional)`}
                                    className="h-7 font-mono text-[11px]"
                                />
                                <IGRPButtonPrimitive
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 gap-1 text-[11px]"
                                    onClick={() => saveOverride(cli, draftPath[cli])}
                                >
                                    <FolderSearch size={12} />
                                    Save path
                                </IGRPButtonPrimitive>
                            </div>
                        </div>
                    )
                })}
            </div>

            <p className="mt-3 text-[10px] text-muted-foreground">
                Tip: Claude Code is usually at <code>~/.claude/local/claude</code> on macOS.
                If <code>which claude</code> works in your terminal but not here, the Studio was
                launched with a different PATH — set the custom path above.
            </p>
        </div>
    )
}

interface ProviderCardProps {
    provider: ProviderRow
    configured: boolean
    onChanged: () => Promise<void>
}

function ProviderCard({ provider, configured, onChanged }: ProviderCardProps): JSX.Element {
    const [value, setValue] = useState('')
    const [reveal, setReveal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<
        { ok: true } | { ok: false; error: string } | null
    >(null)

    const handleSave = async (event: FormEvent) => {
        event.preventDefault()
        if (!value.trim()) return
        setSaving(true)
        setTestResult(null)
        try {
            await window.specSettings.setSecret(provider.id, value.trim())
            await onChanged()
            setValue('')
        } finally {
            setSaving(false)
        }
    }

    const handleTest = async () => {
        setTesting(true)
        setTestResult(null)
        try {
            const result = await window.specSettings.testSecret(provider.id)
            setTestResult(result.ok ? { ok: true } : { ok: false, error: result.error ?? 'Failed' })
        } finally {
            setTesting(false)
        }
    }

    const handleClear = async () => {
        setSaving(true)
        try {
            await window.specSettings.setSecret(provider.id, '')
            await onChanged()
            setTestResult(null)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">{provider.label}</h3>
                        <span
                            className={cn(
                                'rounded px-1.5 py-0.5 text-[9px] font-medium uppercase',
                                configured
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : 'bg-muted text-muted-foreground'
                            )}
                        >
                            {configured ? 'Configured' : 'Not set'}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{provider.description}</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="mt-3 space-y-3">
                <div className="space-y-1.5">
                    <IGRPLabelPrimitive className="text-[11px]">API key</IGRPLabelPrimitive>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <IGRPInputPrimitive
                                type={reveal ? 'text' : 'password'}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={configured ? '•••••••• (replace to update)' : provider.placeholder}
                                className="h-8 pr-8 font-mono text-xs"
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                onClick={() => setReveal((v) => !v)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent"
                                title={reveal ? 'Hide' : 'Show'}
                            >
                                {reveal ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                        </div>
                        <IGRPButtonPrimitive
                            type="submit"
                            size="sm"
                            disabled={!value.trim() || saving}
                            className="h-8"
                        >
                            {saving ? 'Saving…' : 'Save'}
                        </IGRPButtonPrimitive>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <IGRPButtonPrimitive
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={handleTest}
                        disabled={testing || !configured}
                    >
                        {testing ? 'Testing…' : 'Test connection'}
                    </IGRPButtonPrimitive>
                    {configured && (
                        <IGRPButtonPrimitive
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] text-red-500 hover:bg-red-500/10"
                            onClick={handleClear}
                            disabled={saving}
                        >
                            Clear
                        </IGRPButtonPrimitive>
                    )}
                    {testResult?.ok && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                            <CheckCircle2 size={12} /> Connection OK
                        </span>
                    )}
                    {testResult && !testResult.ok && (
                        <span className="flex items-center gap-1 text-[11px] text-red-500">
                            <XCircle size={12} /> {testResult.error}
                        </span>
                    )}
                </div>
            </form>
        </div>
    )
}
