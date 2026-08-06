import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { useGit } from '@renderer/hooks/use-git'
import useGitAuth from '@renderer/hooks/use-git-auth'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { claimCloneSuccess } from '@renderer/lib/clone-success-guard'
import { subscribeIpc } from '@renderer/lib/subscribe-ipc'
import { setBasePath, setConfig } from '@renderer/redux/thunks'
import { getUUID } from '@renderer/utils'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import type { Repository } from 'src/main/types'
import useToast from '../../hooks/useToast'
import { EmptyState } from '../empty-state'
import { LoadingSpinner } from '../loader'
import { CardGitProject } from './card-git-project'
import { ProjectNameDialog } from './dialog-project-name'

export default function GitProject() {
    const { t } = useTranslation()
    const { showErrorToast, showSuccessToast } = useToast()
    const [cloningRepoId, setCloningRepoId] = useState<number | null>(null)
    const [clonedRepos, setClonedRepos] = useState<number[]>([])
    const [projectPaths, setProjectPaths] = useState<Record<number, string>>({})
    const [activeTab, setActiveTab] = useState('github')
    const {
        workspace,
        actions: { saveOrOpenProject }
    } = useWorkspace()

    const dispatch: any = useDispatch()

    const [nameDialog, setNameDialog] = useState({
        isOpen: false,
        defaultName: '',
        onConfirm: (_name: string) => {}
    })

    const { repositoriesGitHub, repositoriesGitLab, isLoading } = useGitAuth()
    const { checkLocalProjects } = useGit()

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
                    const project = data.project
                    const config = project?.config ?? project
                    const type = project?.type
                    const repoId = cloningRepoIdRef.current

                    await saveOrOpenProjectRef.current({
                        project: {
                            workspaceId: workspaceIdRef.current,
                            name: config?.name,
                            framework: config?.type ?? type,
                            config,
                            path: data.path,
                            type,
                            id: config?.id || getUUID()
                        },
                        openProject: true
                    })

                    if (repoId != null) {
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

                    dispatch(setBasePath(data.path))
                    dispatch(setConfig(config))
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
                onConfirm: async (name: string) => {
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
    }, [dispatch])

    const handleClone = async (repo: Repository) => {
        setCloningRepoId(repo.id)
        try {
            await window.electron.ipcRenderer.invoke('clone-repository', repo.clone_url)
        } catch {
            setCloningRepoId(null)
        }
    }

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

    // Check if we have any repositories
    const hasGithubRepos = repositoriesGitHub && repositoriesGitHub.length > 0
    const hasGitlabRepos = repositoriesGitLab && repositoriesGitLab.length > 0

    // If only one provider has repositories, set the active tab accordingly
    useEffect(() => {
        if (!hasGithubRepos && hasGitlabRepos) {
            setActiveTab('gitlab')
        }
    }, [hasGithubRepos, hasGitlabRepos])

    if (isLoading) {
        return <LoadingSpinner />
    }

    // If no repositories are found from either provider
    if (!hasGithubRepos && !hasGitlabRepos) {
        return <EmptyState message={t('noProjectsFound')} className="text-muted-foreground" />
    }

    return (
        <div>
            {/* Only show tabs if both GitHub and GitLab have repositories */}
            {hasGithubRepos && hasGitlabRepos ? (
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
                    <TabsList className="grid w-[400px] grid-cols-2">
                        <TabsTrigger value="github">GitHub</TabsTrigger>
                        <TabsTrigger value="gitlab">GitLab</TabsTrigger>
                    </TabsList>

                    <TabsContent value="github">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {repositoriesGitHub?.map((repo) => (
                                <CardGitProject
                                    repo={repo}
                                    key={repo.id}
                                    handleClone={handleClone}
                                    clonedRepos={clonedRepos}
                                    projectPaths={projectPaths}
                                    isCloning={cloningRepoId === repo.id}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="gitlab">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {repositoriesGitLab?.map((repo) => (
                                <CardGitProject
                                    repo={repo}
                                    key={repo.id}
                                    handleClone={handleClone}
                                    clonedRepos={clonedRepos}
                                    projectPaths={projectPaths}
                                    isCloning={cloningRepoId === repo.id}
                                />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            ) : // If only GitHub has repositories
            hasGithubRepos ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {repositoriesGitHub?.map((repo) => (
                        <CardGitProject
                            repo={repo}
                            key={repo.id}
                            handleClone={handleClone}
                            clonedRepos={clonedRepos}
                            projectPaths={projectPaths}
                            isCloning={cloningRepoId === repo.id}
                        />
                    ))}
                </div>
            ) : (
                // If only GitLab has repositories
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {repositoriesGitLab?.map((repo) => (
                        <CardGitProject
                            repo={repo}
                            key={repo.id}
                            handleClone={handleClone}
                            clonedRepos={clonedRepos}
                            projectPaths={projectPaths}
                            isCloning={cloningRepoId === repo.id}
                        />
                    ))}
                </div>
            )}

            <ProjectNameDialog
                isOpen={nameDialog.isOpen}
                defaultName={nameDialog.defaultName}
                onClose={() => setNameDialog((prev) => ({ ...prev, isOpen: false }))}
                onConfirm={nameDialog.onConfirm}
            />
        </div>
    )
}
