'use client'

import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { useGit } from '@renderer/hooks/use-git'
import useGitAuth from '@renderer/hooks/use-git-auth'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import useToast from '@renderer/hooks/useToast'
import { claimCloneSuccess } from '@renderer/lib/clone-success-guard'
import { subscribeIpc } from '@renderer/lib/subscribe-ipc'
import { getUUID } from '@renderer/utils'
import {
    AlertCircle,
    Calendar,
    Check,
    ExternalLink,
    Eye,
    EyeOff,
    FolderOpen,
    GitFork,
    Github,
    Gitlab,
    Globe,
    KeyRound,
    Link2,
    ListFilter,
    Loader2,
    Lock,
    Search,
    ShieldOff,
    Star,
    User,
    UserCircle,
    X
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { IWorkspace, Repository } from 'src/main/types'

interface CloneProjectModalProps {
    workspace: IWorkspace
    open: boolean
    setOpen: (open: boolean) => void
}

export function CloneProjectModal({
    workspace,
    open: isOpen,
    setOpen: onClose
}: CloneProjectModalProps) {
    const [tab, setTab] = useState<'url' | 'search'>('url')
    const [authMethod, setAuthMethod] = useState<'none' | 'basic' | 'token'>('none')
    const [url, setUrl] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [token, setToken] = useState('')
    const [showBasicPassword, setShowBasicPassword] = useState(false)
    const [showToken, setShowToken] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [platform, setPlatform] = useState<'all' | 'github' | 'gitlab'>('all')
    const [filterMenuOpen, setFilterMenuOpen] = useState(false)
    const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null)
    const [isCloning, setIsCloning] = useState(false)

    const filterRef = useRef<HTMLDivElement>(null)
    const { showErrorToast, showSuccessToast } = useToast()
    const {
        actions: { saveOrOpenProject }
    } = useWorkspace()

    const {
        repositoriesGitHub,
        repositoriesGitLab,
        userGitHub,
        userGitLab,
        loginGithub,
        loginGitLab,
        isLoading,
        reloadData
    } = useGitAuth()
    const { checkLocalProjects } = useGit()
    const isGitConnected = Boolean(userGitHub || userGitLab)

    const [clonedRepos, setClonedRepos] = useState<number[]>([])
    const [projectPaths, setProjectPaths] = useState<Record<number, string>>({})

    const allRepos = useMemo(() => {
        const merged = [...(repositoriesGitHub || []), ...(repositoriesGitLab || [])]
        return merged.toSorted((a, b) => {
            const da = a.updated_at ? Date.parse(a.updated_at) : 0
            const db = b.updated_at ? Date.parse(b.updated_at) : 0
            return db - da
        })
    }, [repositoriesGitHub, repositoriesGitLab])

    useEffect(() => {
        const checkLocalProjectsExist = async () => {
            if (repositoriesGitHub?.length > 0) {
                const githubResults = await checkLocalProjects(repositoriesGitHub)
                setClonedRepos((prev) => [...prev, ...Object.keys(githubResults).map(Number)])
                setProjectPaths((prev) => ({ ...prev, ...githubResults }))
            }

            if (repositoriesGitLab?.length > 0) {
                const gitlabResults = await checkLocalProjects(repositoriesGitLab)
                setClonedRepos((prev) => [...prev, ...Object.keys(gitlabResults).map(Number)])
                setProjectPaths((prev) => ({ ...prev, ...gitlabResults }))
            }
        }

        checkLocalProjectsExist()
    }, [repositoriesGitHub, repositoriesGitLab, checkLocalProjects])

    const gitlabReloadAttempted = useRef(false)
    useEffect(() => {
        if (!isOpen) {
            gitlabReloadAttempted.current = false
            return
        }
        if (tab !== 'search' || !userGitLab || isLoading) return
        if ((repositoriesGitLab?.length ?? 0) > 0) return
        if (gitlabReloadAttempted.current) return
        gitlabReloadAttempted.current = true
        void (async () => {
            await window.electron.ipcRenderer.invoke('git-provider:invalidate-repo-cache', 'gitlab')
            await reloadData()
        })()
    }, [isOpen, tab, userGitLab, repositoriesGitLab, isLoading, reloadData])

    useEffect(() => {
        const loadClonedReposData = async () => {
            try {
                const [cloned, paths] = await Promise.all([
                    window.electron.ipcRenderer.invoke('get-cloned-repos'),
                    window.electron.ipcRenderer.invoke('get-project-paths')
                ])
                setClonedRepos(cloned ?? [])
                setProjectPaths(paths ?? {})
            } catch (error) {
                console.error('Error loading cloned repos data', error)
            }
        }
        loadClonedReposData()
    }, [])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setFilterMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredRepos = useMemo(() => {
        let result = allRepos
        if (platform !== 'all') {
            result = result.filter((r) => r.platform === platform)
        }
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase()
            result = result.filter(
                (r) =>
                    r.full_name.toLowerCase().includes(q) ||
                    (r.description && r.description.toLowerCase().includes(q))
            )
        }
        return result
    }, [allRepos, platform, searchQuery])

    const selectedRepo = allRepos.find((r) => r.id === selectedRepoId)
    const isSelectedRepoCloned = selectedRepo ? clonedRepos.includes(selectedRepo.id) : false

    const resetForm = useCallback(() => {
        setUrl('')
        setAuthMethod('none')
        setUsername('')
        setPassword('')
        setToken('')
        setIsCloning(false)
        setSelectedRepoId(null)
    }, [])

    const handleOpenClonedProject = async (): Promise<void> => {
        if (!selectedRepo) return

        const projectPath =
            projectPaths[selectedRepo.id] || `${workspace.path}/projects/${selectedRepo.name}`

        try {
            const { folderExists, config } = await window.electron.ipcRenderer.invoke(
                'check-project-config',
                projectPath
            )

            if (!folderExists || !config) {
                showErrorToast('Project path not found. Clone the repository again.')
                return
            }

            await saveOrOpenProject({
                project: {
                    ...config,
                    path: projectPath,
                    workspaceId: workspace.id
                },
                openProject: true
            })
            onClose(false)
        } catch (error) {
            console.error('Failed to open cloned project:', error)
            showErrorToast('Failed to open project')
        }
    }

    const handleCloneProject = async (): Promise<void> => {
        if (tab === 'search' && selectedRepo) {
            if (isSelectedRepoCloned) {
                await handleOpenClonedProject()
                return
            }

            setIsCloning(true)
            try {
                const projectPath = `/projects/${selectedRepo.name}`
                await window.electron.ipcRenderer.invoke(
                    'clone-repository',
                    selectedRepo.clone_url,
                    `${workspace.path}${projectPath}`
                )
            } catch (error) {
                console.error('Failed to clone repository:', error)
                showErrorToast(error)
                setIsCloning(false)
            }
            return
        }

        // URL tab
        if (!url.trim()) {
            showErrorToast('Repository URL is required')
            return
        }

        if (authMethod === 'basic' && (!username.trim() || !password.trim())) {
            showErrorToast('Username and password are required')
            return
        }

        if (authMethod === 'token' && !token.trim()) {
            showErrorToast('Token is required')
            return
        }

        const extractProjectPath = (projectUrl: string): string => {
            const match = projectUrl.match(/\/([^/]+)\.git$/)
            return match ? match[1] : ''
        }

        const projectPath = `/projects/${extractProjectPath(url)}`

        const auth = {
            type: authMethod,
            ...(authMethod === 'basic' && { username, password }),
            ...(authMethod === 'token' && { token })
        }

        setIsCloning(true)
        try {
            await window.electron.ipcRenderer.invoke(
                'clone-repository',
                url,
                `${workspace.path}${projectPath}`,
                auth
            )
        } catch (error) {
            console.error('Error cloning repository', error)
            showErrorToast(error)
            setIsCloning(false)
        }
    }

    const selectedRepoIdRef = useRef(selectedRepoId)
    selectedRepoIdRef.current = selectedRepoId

    const resetFormRef = useRef(resetForm)
    resetFormRef.current = resetForm
    const saveOrOpenProjectRef = useRef(saveOrOpenProject)
    saveOrOpenProjectRef.current = saveOrOpenProject
    const showSuccessToastRef = useRef(showSuccessToast)
    showSuccessToastRef.current = showSuccessToast
    const showErrorToastRef = useRef(showErrorToast)
    showErrorToastRef.current = showErrorToast

    useEffect(() => {
        if (!isOpen) {
            return
        }

        const onCloneProgress = async (_event: unknown, data: any) => {
            if (data.status === 'success') {
                // Guard against duplicate handlers across surfaces / leaked listeners.
                if (!claimCloneSuccess(data.path)) return

                resetFormRef.current()
                showSuccessToastRef.current(
                    `Repository cloned successfully to ${data.path}`
                )
                try {
                    const { project, path } = data
                    const { config, type } = project
                    const repoId = selectedRepoIdRef.current

                    await saveOrOpenProjectRef.current({
                        project: {
                            workspaceId: workspace.id,
                            name: config.name,
                            framework: config.type,
                            id: config.id || getUUID(),
                            type,
                            path,
                            config
                        },
                        openProject: true,
                        onSuccess: async () => {
                            if (repoId) {
                                await window.electron.ipcRenderer.invoke(
                                    'add-cloned-repo',
                                    repoId
                                )
                                await window.electron.ipcRenderer.invoke('set-project-path', {
                                    repoId,
                                    path: data.path
                                })
                                setClonedRepos((prevRepos) => [...prevRepos, repoId])
                                setProjectPaths((prev) => ({
                                    ...prev,
                                    [repoId]: data.path
                                }))
                            }
                        }
                    })
                } catch (error) {
                    showErrorToastRef.current('Failed to open project after cloning')
                    console.error('Error opening project', error)
                }
            } else if (data.status === 'error') {
                showErrorToastRef.current(`Failed to clone repository: ${data.message}`)
            }
            if (data.status === 'success' || data.status === 'error') {
                setIsCloning(false)
            }
        }

        return subscribeIpc('clone-progress', onCloneProgress)
    }, [isOpen, workspace.id])

    if (!isOpen || typeof document === 'undefined') return null

    const handleBackdropClick = () => {
        if (!isCloning) onClose(false)
    }

    const modalContent = (
        // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-close is a standard modal a11y exception (Escape is the keyboard close path)
        // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click-to-close is a standard modal a11y exception (Escape is the keyboard close path)
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                className="w-full max-w-lg max-h-[80vh] bg-card rounded-sm border border-border shadow-lg overflow-hidden flex flex-col font-sans"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="pl-3 pr-2 py-1.5 bg-muted border-b border-border flex items-center justify-between select-none shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-primary rounded scale-90 flex items-center justify-center">
                            <GitFork className="w-2.5 h-2.5 text-primary-foreground stroke-[3]" />
                        </div>
                        <span className="text-xs font-medium text-foreground tracking-tight">
                            Clone Project
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => !isCloning && onClose(false)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted group transition-colors"
                        disabled={isCloning}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Body container */}
                <div className="px-5 py-4 space-y-3.5 flex-1 flex flex-col min-h-0">
                    {/* Tab switcher */}
                    <div className="flex p-0.5 bg-muted rounded border border-border/50 shrink-0 select-none">
                        <button
                            type="button"
                            onClick={() => setTab('url')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-semibold rounded-sm transition-all ${
                                tab === 'url'
                                    ? 'bg-card text-foreground shadow-sm border border-border/20 font-bold'
                                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                            }`}
                        >
                            <Link2 className="w-3 h-3 text-muted-foreground" />
                            Repository URL
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('search')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-semibold rounded-sm transition-all ${
                                tab === 'search'
                                    ? 'bg-card text-foreground shadow-sm border border-border/20 font-bold'
                                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                            }`}
                        >
                            <Search className="w-3 h-3 text-muted-foreground" />
                            Search Repositories
                        </button>
                    </div>

                    {/* Tab content */}
                    <AnimatePresence mode="wait">
                        {tab === 'url' ? (
                            <motion.div
                                key="url"
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 6 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-3.5"
                            >
                                {/* URL field block */}
                                <div className="space-y-1">
                                    <label
                                        htmlFor="clone-repo-url"
                                        className="block text-xs font-medium text-muted-foreground pl-0.5"
                                    >
                                        Repo URL
                                    </label>
                                    <div className="relative group/input">
                                        <Globe className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                                        <input
                                            id="clone-repo-url"
                                            type="text"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="https://github.com/username/repo.git"
                                            className="w-full pl-8 pr-2 py-1 bg-card border border-input rounded-sm text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)]"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 pl-0.5">
                                        Supports GitHub and GitLab URLs
                                    </p>
                                </div>

                                {/* Auth Type block */}
                                <div className="space-y-1">
                                    <span className="block text-xs font-medium text-muted-foreground pl-0.5">
                                        Auth Type
                                    </span>
                                    <div className="space-y-2.5">
                                        <div className="grid grid-cols-3 gap-1 p-0.5 bg-muted rounded border border-border/50 select-none">
                                            {[
                                                { id: 'none', label: 'None', icon: ShieldOff },
                                                { id: 'basic', label: 'Basic', icon: UserCircle },
                                                { id: 'token', label: 'Token', icon: KeyRound }
                                            ].map((method) => {
                                                const Icon = method.icon
                                                const isActive = authMethod === method.id
                                                return (
                                                    <button
                                                        key={method.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setAuthMethod(method.id as any)
                                                        }
                                                        className={`flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-sm transition-all ${
                                                            isActive
                                                                ? 'bg-card text-foreground shadow-xs font-bold'
                                                                : 'text-muted-foreground hover:text-foreground font-medium'
                                                        }`}
                                                    >
                                                        <Icon
                                                            className={`w-3.5 h-3.5 ${
                                                                isActive
                                                                    ? 'text-primary'
                                                                    : 'text-muted-foreground'
                                                            }`}
                                                        />
                                                        {method.label}
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {authMethod === 'basic' && (
                                                <motion.div
                                                    key="basic"
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="grid grid-cols-2 gap-2"
                                                >
                                                    <div className="space-y-1">
                                                        <label
                                                            htmlFor="clone-basic-username"
                                                            className="block text-xs font-medium text-muted-foreground pl-0.5"
                                                        >
                                                            Username
                                                        </label>
                                                        <div className="relative group/input">
                                                            <User className="w-3 h-3 absolute left-2 top-1.5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                                                            <input
                                                                id="clone-basic-username"
                                                                type="text"
                                                                value={username}
                                                                onChange={(e) =>
                                                                    setUsername(e.target.value)
                                                                }
                                                                placeholder="Username"
                                                                className="w-full pl-7 pr-2 py-1 bg-card border border-input rounded-sm text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label
                                                            htmlFor="clone-basic-password"
                                                            className="block text-xs font-medium text-muted-foreground pl-0.5"
                                                        >
                                                            Password / PAT
                                                        </label>
                                                        <div className="relative group/input">
                                                            <KeyRound className="w-3 h-3 absolute left-2 top-1.5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                                                            <input
                                                                id="clone-basic-password"
                                                                type={
                                                                    showBasicPassword
                                                                        ? 'text'
                                                                        : 'password'
                                                                }
                                                                value={password}
                                                                onChange={(e) =>
                                                                    setPassword(e.target.value)
                                                                }
                                                                placeholder="••••••••"
                                                                className="w-full pl-7 pr-6 py-1 bg-card border border-input rounded-sm text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)]"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setShowBasicPassword(
                                                                        !showBasicPassword
                                                                    )
                                                                }
                                                                className="absolute right-1.5 top-1 p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                                            >
                                                                <AnimatePresence mode="wait">
                                                                    <motion.div
                                                                        key={
                                                                            showBasicPassword
                                                                                ? 'show'
                                                                                : 'hide'
                                                                        }
                                                                        initial={{
                                                                            opacity: 0,
                                                                            scale: 0.5
                                                                        }}
                                                                        animate={{
                                                                            opacity: 1,
                                                                            scale: 1
                                                                        }}
                                                                        exit={{
                                                                            opacity: 0,
                                                                            scale: 0.5
                                                                        }}
                                                                        transition={{
                                                                            duration: 0.1
                                                                        }}
                                                                    >
                                                                        {showBasicPassword ? (
                                                                            <Eye className="w-3 h-3" />
                                                                        ) : (
                                                                            <EyeOff className="w-3 h-3" />
                                                                        )}
                                                                    </motion.div>
                                                                </AnimatePresence>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {authMethod === 'token' && (
                                                <motion.div
                                                    key="token"
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="space-y-1"
                                                >
                                                    <label
                                                        htmlFor="clone-token"
                                                        className="block text-xs font-medium text-muted-foreground pl-0.5"
                                                    >
                                                        Personal Access Token
                                                    </label>
                                                    <div className="relative group/input">
                                                        <KeyRound className="w-3 h-3 absolute left-2 top-1.5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                                                        <input
                                                            id="clone-token"
                                                            type={showToken ? 'text' : 'password'}
                                                            value={token}
                                                            onChange={(e) =>
                                                                setToken(e.target.value)
                                                            }
                                                            placeholder="ghp_xxxxxxxxxxxx"
                                                            className="w-full pl-7 pr-6 py-1 bg-card border border-input rounded-sm text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)]"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowToken(!showToken)}
                                                            className="absolute right-1.5 top-1 p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                                        >
                                                            <AnimatePresence mode="wait">
                                                                <motion.div
                                                                    key={
                                                                        showToken ? 'show' : 'hide'
                                                                    }
                                                                    initial={{
                                                                        opacity: 0,
                                                                        scale: 0.5
                                                                    }}
                                                                    animate={{
                                                                        opacity: 1,
                                                                        scale: 1
                                                                    }}
                                                                    exit={{
                                                                        opacity: 0,
                                                                        scale: 0.5
                                                                    }}
                                                                    transition={{ duration: 0.1 }}
                                                                >
                                                                    {showToken ? (
                                                                        <Eye className="w-3 h-3" />
                                                                    ) : (
                                                                        <EyeOff className="w-3 h-3" />
                                                                    )}
                                                                </motion.div>
                                                            </AnimatePresence>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="search"
                                initial={{ opacity: 0, x: 6 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -6 }}
                                transition={{ duration: 0.15 }}
                                className="flex-1 flex flex-col space-y-3 min-h-0"
                            >
                                {/* Search + filter row */}
                                <div className="flex flex-col gap-1.5 shrink-0">
                                    <div className="flex gap-1.5">
                                        <div className="relative group/input flex-1">
                                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search repositories..."
                                                className="w-full pl-8 pr-2 py-1 bg-card border border-input rounded-sm text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)]"
                                            />
                                        </div>
                                        <div className="relative" ref={filterRef}>
                                            <button
                                                type="button"
                                                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                                                className={`h-full px-2.5 py-1.5 flex items-center gap-1.5 border rounded-sm text-xs font-bold transition-colors ${
                                                    filterMenuOpen || platform !== 'all'
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                                                }`}
                                            >
                                                <ListFilter className="w-3.5 h-3.5" />
                                                Filter
                                            </button>

                                            <AnimatePresence>
                                                {filterMenuOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                                        transition={{ duration: 0.1 }}
                                                        className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-sm shadow-md z-20 p-0.5 space-y-1"
                                                    >
                                                        {[
                                                            {
                                                                id: 'all',
                                                                label: 'All Platforms',
                                                                icon: Globe
                                                            },
                                                            {
                                                                id: 'github',
                                                                label: 'GitHub',
                                                                icon: Github
                                                            },
                                                            {
                                                                id: 'gitlab',
                                                                label: 'GitLab',
                                                                icon: Gitlab
                                                            }
                                                        ].map((p) => {
                                                            const Icon = p.icon
                                                            const isSelected = platform === p.id
                                                            return (
                                                                <button
                                                                    key={p.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setPlatform(p.id as any)
                                                                        setFilterMenuOpen(false)
                                                                    }}
                                                                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                                                                        isSelected
                                                                            ? 'bg-primary/10 text-primary font-semibold'
                                                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                                    }`}
                                                                >
                                                                    <span className="flex items-center gap-1.5">
                                                                        <Icon className="w-3 h-3 text-muted-foreground" />
                                                                        {p.label}
                                                                    </span>
                                                                    {isSelected && (
                                                                        <Check className="w-2.5 h-2.5 text-primary stroke-[3]" />
                                                                    )}
                                                                </button>
                                                            )
                                                        })}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {platform !== 'all' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded-sm border border-primary/30 text-xs font-bold uppercase tracking-wider w-fit">
                                                    <span className="opacity-60">Platform:</span>
                                                    {platform === 'github' ? (
                                                        <Github className="w-2.5 h-2.5" />
                                                    ) : (
                                                        <Gitlab className="w-2.5 h-2.5" />
                                                    )}
                                                    {platform === 'github' ? 'GitHub' : 'GitLab'}
                                                    <button
                                                        type="button"
                                                        onClick={() => setPlatform('all')}
                                                        className="ml-1 p-0.5 hover:bg-primary/10 rounded transition-colors"
                                                    >
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Results container */}
                                <div className="bg-muted border border-input rounded-sm overflow-hidden flex flex-col">
                                    {filteredRepos.length > 0 ? (
                                        <ScrollArea className="h-96">
                                            <div className="divide-y divide-border">
                                            {filteredRepos.map((repo) => {
                                                const isSelected = selectedRepoId === repo.id
                                                const isCloned = clonedRepos.includes(repo.id)
                                                const repoKey = `${repo.platform}-${repo.id}`
                                                return (
                                                    // biome-ignore lint/a11y/useSemanticElements: list item contains nested action buttons; the wrapper can't itself be a <button>
                                                    <div
                                                        key={repoKey}
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => setSelectedRepoId(repo.id)}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key === 'Enter' ||
                                                                e.key === ' '
                                                            ) {
                                                                e.preventDefault()
                                                                setSelectedRepoId(repo.id)
                                                            }
                                                        }}
                                                        className={`w-full group flex items-start gap-3 p-2.5 outline-none transition-colors relative ${
                                                            isSelected
                                                                ? 'bg-primary/5 shadow-[inset_0_0_0_1px_rgba(13,148,136,0.1)] z-10'
                                                                : 'bg-card hover:bg-muted/75'
                                                        }`}
                                                    >
                                                        {isSelected && (
                                                            <motion.div
                                                                layoutId="active-bar"
                                                                className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                exit={{ opacity: 0 }}
                                                            />
                                                        )}

                                                        <div
                                                            className={`mt-0.5 size-7 rounded border flex items-center justify-center shrink-0 transition-all ${
                                                                isSelected
                                                                    ? 'bg-primary border-primary scale-105'
                                                                    : 'bg-card border-border group-hover:bg-muted'
                                                            }`}
                                                        >
                                                            {repo.platform === 'github' ? (
                                                                <Github
                                                                    className={`w-3.5 h-3.5 ${
                                                                        isSelected
                                                                            ? 'text-primary-foreground'
                                                                            : 'text-muted-foreground'
                                                                    }`}
                                                                />
                                                            ) : (
                                                                <Gitlab
                                                                    className={`w-3.5 h-3.5 ${
                                                                        isSelected
                                                                            ? 'text-primary-foreground'
                                                                            : 'text-orange-500'
                                                                    }`}
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0 space-y-0.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <span
                                                                    className={`text-xs font-bold truncate ${
                                                                        isSelected
                                                                            ? 'text-primary'
                                                                            : 'text-foreground'
                                                                    }`}
                                                                >
                                                                    {repo.full_name}
                                                                </span>
                                                                {repo.private && (
                                                                    <Lock
                                                                        className={`w-2.5 h-2.5 shrink-0 ${
                                                                            isSelected
                                                                                ? 'text-primary'
                                                                                : 'text-muted-foreground'
                                                                        }`}
                                                                    />
                                                                )}
                                                                <AnimatePresence>
                                                                    {isCloned && (
                                                                        <motion.div
                                                                            initial={{
                                                                                scale: 0,
                                                                                opacity: 0
                                                                            }}
                                                                            animate={{
                                                                                scale: 1,
                                                                                opacity: 1
                                                                            }}
                                                                            className="bg-primary rounded-full p-0.5 scale-75 shrink-0"
                                                                        >
                                                                            <Check className="w-2.5 h-2.5 text-primary-foreground stroke-[4px]" />
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>

                                                            {repo.description ? (
                                                                <p
                                                                    className={`text-xs line-clamp-2 leading-tight ${
                                                                        isSelected
                                                                            ? 'text-primary/80'
                                                                            : 'text-muted-foreground'
                                                                    }`}
                                                                >
                                                                    {repo.description}
                                                                </p>
                                                            ) : (
                                                                <div className="flex items-center gap-1 text-xs italic text-muted-foreground">
                                                                    <AlertCircle className="w-2.5 h-2.5" />
                                                                    No description provided
                                                                </div>
                                                            )}

                                                            <div className="flex items-center gap-3 pt-0.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                                {repo.updated_at && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                                                        {new Date(
                                                                            repo.updated_at
                                                                        ).toLocaleDateString(
                                                                            undefined,
                                                                            {
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                                year: 'numeric'
                                                                            }
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {(repo as any).stargazers_count !== undefined && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                                                                        {(repo as any).stargazers_count}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 shrink-0 ml-1.5 self-start pt-0.5">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    window.open(
                                                                        repo.html_url ||
                                                                            repo.clone_url,
                                                                        '_blank'
                                                                    )
                                                                }}
                                                                className={`p-1 rounded hover:bg-muted transition-colors ${
                                                                    isSelected
                                                                        ? 'text-primary'
                                                                        : 'text-muted-foreground hover:text-foreground'
                                                                }`}
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {isLoading && userGitLab && (repositoriesGitLab?.length ?? 0) === 0 ? (
                                                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground bg-card">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    Loading GitLab repositories…
                                                </div>
                                            ) : null}
                                            </div>
                                        </ScrollArea>
                                    ) : isLoading ? (
                                        <div className="flex-1 min-h-56 flex flex-col items-center justify-center p-6 text-center select-none bg-card">
                                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mb-3" />
                                            <span className="text-xs font-bold text-foreground">
                                                Loading repositories
                                            </span>
                                            <p className="text-xs text-muted-foreground max-w-48 mt-1 leading-tight">
                                                Fetching GitHub and GitLab projects…
                                            </p>
                                        </div>
                                    ) : !isGitConnected ? (
                                        <div className="flex-1 min-h-56 flex flex-col items-center justify-center p-6 text-center select-none bg-card">
                                            <div className="w-10 h-10 bg-muted border border-border rounded-lg flex items-center justify-center mb-3">
                                                <Gitlab className="w-5 h-5 text-muted-foreground/60" />
                                            </div>
                                            <span className="text-xs font-bold text-foreground">
                                                Connect an account
                                            </span>
                                            <p className="text-xs text-muted-foreground max-w-48 mt-1 leading-tight">
                                                Sign in to GitHub or GitLab to search and clone your
                                                repositories.
                                            </p>
                                            <div className="flex items-center gap-2 mt-3">
                                                <button
                                                    type="button"
                                                    onClick={loginGithub}
                                                    className="px-3 py-1 text-xs font-bold rounded-sm border border-border bg-card hover:bg-muted flex items-center gap-1.5"
                                                >
                                                    <Github className="w-3 h-3" />
                                                    GitHub
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => loginGitLab()}
                                                    className="px-3 py-1 text-xs font-bold rounded-sm border border-border bg-card hover:bg-muted flex items-center gap-1.5"
                                                >
                                                    <Gitlab className="w-3 h-3" />
                                                    GitLab
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 min-h-56 flex flex-col items-center justify-center p-6 text-center select-none bg-card">
                                            <div className="w-10 h-10 bg-muted border border-border rounded-lg flex items-center justify-center mb-3">
                                                <Search className="w-5 h-5 text-muted-foreground/60" />
                                            </div>
                                            <span className="text-xs font-bold text-foreground">
                                                No repositories found
                                            </span>
                                            <p className="text-xs text-muted-foreground max-w-44 mt-1 leading-tight">
                                                Try adjusting your search or filters to find what
                                                you're looking for.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-3 py-2 bg-muted border-t border-border flex items-center justify-end gap-2 shrink-0 select-none">
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        className="px-4 py-1 text-xs font-bold text-muted-foreground bg-card border border-border rounded-sm hover:bg-muted min-w-16 transition-colors"
                        disabled={isCloning}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleCloneProject}
                        disabled={isCloning || (tab === 'search' && !selectedRepoId)}
                        className={`min-w-28 px-4 py-1 text-xs font-bold rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 border ${
                            tab === 'search' && isSelectedRepoCloned && !isCloning
                                ? 'bg-black border-black text-white'
                                : 'bg-primary border-primary text-primary-foreground'
                        }`}
                    >
                        {isCloning ? (
                            <span>Cloning...</span>
                        ) : (
                            <AnimatePresence mode="wait">
                                {tab === 'search' && isSelectedRepoCloned ? (
                                    <motion.div
                                        key="open"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="flex items-center gap-1.5 text-white"
                                    >
                                        <FolderOpen className="w-3.5 h-3.5" />
                                        Open Project
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="clone"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="flex items-center gap-1.5 text-primary-foreground"
                                    >
                                        <GitFork className="w-3.5 h-3.5" />
                                        Clone Project
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
