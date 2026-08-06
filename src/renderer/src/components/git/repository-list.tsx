'use client'

import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useGit } from '@renderer/hooks/use-git'
import useGitAuth from '@renderer/hooks/use-git-auth'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import useToast from '@renderer/hooks/useToast'
import { claimCloneSuccess } from '@renderer/lib/clone-success-guard'
import { subscribeIpc } from '@renderer/lib/subscribe-ipc'
import { getUUID } from '@renderer/utils'
import { AlertCircle, Filter, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Repository, RepositoryPlatform } from 'src/main/types'
import { SearchInput } from '../shared-ui'
import { ProjectNameDialog } from './dialog-project-name'
import { ListGitProject } from './list-git-project'
import { PlatformIcon } from './platform-icon'

export function RepositoryList() {
    const { t } = useTranslation()
    const { showErrorToast, showSuccessToast } = useToast()
    const {
        workspace,
        actions: { saveOrOpenProject }
    } = useWorkspace()
    const { repositoriesGitHub, repositoriesGitLab, isLoading } = useGitAuth()
    const { checkLocalProjects } = useGit()
    const [nameDialog, setNameDialog] = useState({
        isOpen: false,
        defaultName: '',
        onConfirm: (_name: string) => {}
    })

    const [searchQuery, setSearchQuery] = useState('')
    const [repositories, setRepositories] = useState<Repository[]>([])
    const [filteredRepositories, setFilteredRepositories] = useState<Repository[]>([])
    const [platformFilter, setPlatformFilter] = useState<RepositoryPlatform | 'all'>('all')
    const [clonedRepos, setClonedRepos] = useState<number[]>([])
    const [projectPaths, setProjectPaths] = useState<Record<number, string>>({})
    const [isCloning, setIsCloning] = useState(false)
    const [cloningRepoId, setCloningRepoId] = useState<number | null>(null)

    useEffect(() => {
        setRepositories([...repositoriesGitHub, ...repositoriesGitLab])
        setFilteredRepositories([...repositoriesGitHub, ...repositoriesGitLab])
    }, [repositoriesGitHub, repositoriesGitLab])

    useEffect(() => {
        // Filter by platform first
        let platformFiltered = repositories
        if (platformFilter !== 'all') {
            platformFiltered = repositories.filter((repo) => repo.platform === platformFilter)
        }

        // Then filter by search query
        if (searchQuery.trim() === '') {
            setFilteredRepositories(platformFiltered)
        } else {
            const lowercaseQuery = searchQuery.toLowerCase()
            const filtered = platformFiltered.filter(
                (repo) =>
                    repo.name.toLowerCase().includes(lowercaseQuery) ||
                    repo.full_name.toLowerCase().includes(lowercaseQuery) ||
                    (repo.description && repo.description.toLowerCase().includes(lowercaseQuery))
            )
            setFilteredRepositories(filtered)
        }
    }, [searchQuery, repositories, platformFilter])

    const handleClone = async (repo: Repository) => {
        if (isCloning) return

        setIsCloning(true)

        setCloningRepoId(repo.id)

        try {
            const projectPath = `/projects/${repo.name}`

            setClonedRepos((prev) => [...prev, repo.id])

            setProjectPaths((prev) => ({
                ...prev,
                [repo.id]: projectPath
            }))

            await window.electron.ipcRenderer.invoke(
                'clone-repository',
                repo.clone_url,
                `${workspace.path}${projectPath}`
            )
        } catch (error) {
            console.error('Failed to clone repository:', error)
        } finally {
            setIsCloning(false)
            setCloningRepoId(null)
        }
    }

    const cloningRepoIdRef = useRef(cloningRepoId)
    cloningRepoIdRef.current = cloningRepoId
    const saveOrOpenProjectRef = useRef(saveOrOpenProject)
    saveOrOpenProjectRef.current = saveOrOpenProject
    const showSuccessToastRef = useRef(showSuccessToast)
    showSuccessToastRef.current = showSuccessToast
    const showErrorToastRef = useRef(showErrorToast)
    showErrorToastRef.current = showErrorToast
    const tRef = useRef(t)
    tRef.current = t
    const workspaceIdRef = useRef(workspace.id)
    workspaceIdRef.current = workspace.id

    useEffect(() => {
        const onCloneProgress = async (_event: unknown, data: any) => {
            if (data.status === 'success' || data.status === 'error') {
                setCloningRepoId(null)
            }
            if (data.status === 'success') {
                if (!claimCloneSuccess(data.path)) return

                showSuccessToastRef.current(
                    tRef.current('repositoryClonedSuccessfully', { path: data.path })
                )
                try {
                    const { project, path } = data
                    const { config, type } = project
                    const repoId = cloningRepoIdRef.current

                    await saveOrOpenProjectRef.current({
                        project: {
                            workspaceId: workspaceIdRef.current,
                            name: config.name,
                            framework: config.type,
                            id: config.id || getUUID(),
                            type,
                            path,
                            config
                        },
                        openProject: true,
                        onSuccess: async () => {
                            if (repoId == null) return
                            await window.electron.ipcRenderer.invoke('add-cloned-repo', repoId)
                            await window.electron.ipcRenderer.invoke('set-project-path', {
                                repoId,
                                path: data.path
                            })

                            setClonedRepos((prevRepos) => [...prevRepos, repoId])

                            setProjectPaths((prevPaths) => ({
                                ...prevPaths,
                                [repoId]: data.path
                            }))
                        }
                    })
                } catch (error) {
                    showErrorToastRef.current(tRef.current('failedOpenProjectAfterCloning'))
                    console.error(tRef.current('errorOpeningProject'), error)
                }
            } else if (data.status === 'error') {
                showErrorToastRef.current(
                    tRef.current('failedCloneRepository', { message: data.message })
                )
            }
        }

        const onRequestProjectName = (_event: unknown, { defaultName }: { defaultName: string }) => {
            setNameDialog({
                isOpen: true,
                defaultName,
                onConfirm: async (name) => {
                    window.electron.ipcRenderer.send('project-name-response', name)
                    setNameDialog((prev) => ({ ...prev, isOpen: false }))
                }
            })
        }

        const offClone = subscribeIpc('clone-progress', onCloneProgress)
        const offName = subscribeIpc('request-project-name', onRequestProjectName)

        return () => {
            offClone()
            offName()
        }
    }, [])

    useEffect(() => {
        const loadClonedReposData = async () => {
            try {
                const [cloned, paths] = await Promise.all([
                    window.electron.ipcRenderer.invoke('get-cloned-repos'),
                    window.electron.ipcRenderer.invoke('get-project-paths')
                ])
                setClonedRepos(cloned)
                setProjectPaths(paths)
            } catch (error) {
                console.error(t('errorLoadingClonedReposData'), error)
                showErrorToast(t('failedLoadRepositoryData'))
            }
        }

        loadClonedReposData()
    }, [t, showErrorToast])

    useEffect(() => {
        const checkLocalProjectsExist = async () => {
            if (!repositoriesGitHub && !repositoriesGitLab) return

            // Check GitHub repositories
            if (repositoriesGitHub?.length > 0) {
                const githubResults = await checkLocalProjects(repositoriesGitHub)
                setClonedRepos((prev) => [...prev, ...Object.keys(githubResults).map(Number)])
                setProjectPaths((prev) => ({ ...prev, ...githubResults }))
            }

            // Check GitLab repositories
            if (repositoriesGitLab?.length > 0) {
                const gitlabResults = await checkLocalProjects(repositoriesGitLab)
                setClonedRepos((prev) => [...prev, ...Object.keys(gitlabResults).map(Number)])
                setProjectPaths((prev) => ({ ...prev, ...gitlabResults }))
            }
        }

        checkLocalProjectsExist()
    }, [repositoriesGitHub, repositoriesGitLab, checkLocalProjects])

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <SearchInput
                    placeholder="Search repositories..."
                    value={searchQuery}
                    className="w-full"
                    onChange={(value) => setSearchQuery(value)}
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                            <Filter className="h-4 w-4" />
                            {t('filter')}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPlatformFilter('all')}>
                            {t('allPlatforms')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setPlatformFilter('github')}
                            className="flex items-center gap-2"
                        >
                            <PlatformIcon platform="github" className="h-4 w-4" />
                            {t('github')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setPlatformFilter('gitlab')}
                            className="flex items-center gap-2"
                        >
                            <PlatformIcon platform="gitlab" className="h-4 w-4" />
                            {t('gitlab')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {platformFilter !== 'all' && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{t('filterBy')}</span>
                    <Badge variant="default" className="flex items-center gap-1">
                        <PlatformIcon platform={platformFilter} className="h-3 w-3" />
                        {platformFilter === 'github' ? 'GitHub' : 'GitLab'}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => setPlatformFilter('all')}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">{t('removeFilter')}</span>
                        </Button>
                    </Badge>
                </div>
            )}

            <div className="border rounded-md overflow-hidden">
                <ScrollArea className="h-[400px]">
                    {isLoading ? (
                        <div className="divide-y">
                            {[1, 2, 3, 4, 5].map((skeletonId) => (
                                <div key={skeletonId} className="p-4 flex items-center">
                                    <Skeleton className="h-10 w-10 rounded-full mr-4" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-8 w-8 rounded-md" />
                                        <Skeleton className="h-8 w-20 rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredRepositories.length === 0 ? (
                        <div className="p-8 text-center">
                            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 font-medium">{t('noRepositoriesFound')}</p>
                            <p className="text-gray-400 text-sm mt-1">
                                {t('tryAdjustingYourSearchOrFilters')}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredRepositories.map((repo) => (
                                <ListGitProject
                                    key={repo.id}
                                    repo={repo}
                                    handleClone={handleClone}
                                    clonedRepos={clonedRepos}
                                    projectPaths={projectPaths}
                                    isCloning={isCloning}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            <ProjectNameDialog
                isOpen={nameDialog.isOpen}
                defaultName={nameDialog.defaultName}
                onClose={() => setNameDialog((prev) => ({ ...prev, isOpen: false }))}
                onConfirm={nameDialog.onConfirm}
            />
        </div>
    )
}
