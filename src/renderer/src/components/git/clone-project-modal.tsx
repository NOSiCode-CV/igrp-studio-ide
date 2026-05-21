import { Button } from '@renderer/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { IGRPInputPassword } from '@igrp/igrp-framework-react-design-system'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import useToast from '@renderer/hooks/useToast'
import { getUUID } from '@renderer/utils'
import { GitFork, Key, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IWorkspace } from 'src/main/types'
import { RepositoryList } from './repository-list'

interface CloneProjectModalProps {
    workspace: IWorkspace
    open: boolean
    setOpen: (open: boolean) => void
}

export function CloneProjectModal({ workspace, open, setOpen }: CloneProjectModalProps) {
    const { t } = useTranslation()
    const [projectUrl, setProjectUrl] = useState('')
    const [authType, setAuthType] = useState('none')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [token, setToken] = useState('')
    const [isCloning, setIsCloning] = useState(false)

    const { showErrorToast, showSuccessToast } = useToast()

    const {
        actions: { saveOrOpenProject }
    } = useWorkspace()

    /* const onClone = () => {
          const auth = {
             type: authType,
             ...(authType === 'basic' && { username, password }),
             ...(authType === 'token' && { token }),
         }; 
        handleCloneProject(projectUrl);

    }; */

    const resetForm = useCallback(() => {
        setProjectUrl('')
        setAuthType('none')
        setUsername('')
        setPassword('')
        setToken('')
        setIsCloning(false)
    }, [])

    const handleCloneProject = async (): Promise<void> => {
        // Validate required fields
        if (!projectUrl.trim()) {
            showErrorToast(t('repositoryUrlRequired'))
            return
        }

        // Validate authentication fields based on type
        if (authType === 'basic' && (!username.trim() || !password.trim())) {
            showErrorToast(t('usernameAndPasswordRequired'))
            return
        }

        if (authType === 'token' && !token.trim()) {
            showErrorToast(t('tokenRequired'))
            return
        }

        const extractProjectPath = (projectUrl: string): string => {
            const match = projectUrl.match(/\/([^/]+)\.git$/)
            return match ? match[1] : ''
        }

        const projectPath = `/projects/${extractProjectPath(projectUrl)}`

        // Prepare authentication data
        const auth = {
            type: authType,
            ...(authType === 'basic' && { username, password }),
            ...(authType === 'token' && { token })
        }

        setIsCloning(true)
        try {
            await window.electron.ipcRenderer.invoke(
                'clone-repository',
                projectUrl,
                `${workspace.path}${projectPath}`,
                auth
            )
        } catch (error) {
            console.error(t('errorCloningRepository'), error)
            showErrorToast(error)
        } finally {
            setIsCloning(false)
        }
    }

    useEffect(() => {
        const onCloneProgress = async (_event: any, data: any) => {
            if (data.status === 'success') {
                resetForm()

                showSuccessToast(t('repositoryClonedSuccessfully', { path: data.path }))
                try {
                    const { project, path } = data
                    const { config, type } = project

                    await saveOrOpenProject({
                        project: {
                            workspaceId: workspace.id,
                            name: config.name,
                            framework: config.type,
                            id: config.id || getUUID(),
                            type,
                            path,
                            config
                        },
                        onSuccess: async () => {}
                    })
                } catch (error) {
                    showErrorToast(t('failedOpenProjectAfterCloning'))
                    console.error(t('errorOpeningProject'), error)
                }
            } else if (data.status === 'error') {
                showErrorToast(t('failedCloneRepository', { message: data.message }))
            }
        }

        window.electron.ipcRenderer.on('clone-progress', onCloneProgress)

        return () => {
            window.electron.ipcRenderer.removeListener('clone-progress', onCloneProgress)
        }
    }, [resetForm, saveOrOpenProject, showErrorToast, showSuccessToast, t, workspace.id])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[700px] lg:max-w-[650px] max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="">
                    <DialogTitle className="">{t('cloneProject')}</DialogTitle>
                    <DialogDescription />
                </DialogHeader>
                <div className="flex-1 overflow-hidden flex flex-col">
                    <Tabs defaultValue="url" className="w-full flex-1 flex flex-col">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="url">{t('repositoryUrl')}</TabsTrigger>
                            <TabsTrigger value="search">{t('searchRepositories')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="url" className="space-y-4 flex-1 overflow-auto">
                            <div className="grid gap-6 py-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 grid gap-2">
                                        <Label
                                            htmlFor="project-url"
                                            className="text-muted-foreground"
                                        >
                                            {t('repositoryUrl')}
                                        </Label>
                                        <Input
                                            id="project-url"
                                            placeholder={t('repositoryUrlPlaceholder')}
                                            value={projectUrl}
                                            onChange={(e) => setProjectUrl(e.target.value)}
                                            className="bg-background text-foreground placeholder-muted-foreground"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-muted-foreground">
                                        {t('authentication')}
                                    </Label>
                                    <Tabs value={authType} onValueChange={setAuthType}>
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="none">{t('none')}</TabsTrigger>
                                            <TabsTrigger value="basic">{t('basic')}</TabsTrigger>
                                            <TabsTrigger value="token">{t('token')}</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="none" className="mt-4">
                                            {/* No authentication content */}
                                        </TabsContent>

                                        <TabsContent value="basic" className="mt-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="username"
                                                        className="text-muted-foreground"
                                                    >
                                                        {t('username')}
                                                    </Label>
                                                    <div className="relative">
                                                        <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            id="username"
                                                            placeholder={t('usernamePlaceholder')}
                                                            value={username}
                                                            onChange={(e) =>
                                                                setUsername(e.target.value)
                                                            }
                                                            className="pl-8 bg-background text-foreground placeholder-muted-foreground"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="password"
                                                        className="text-muted-foreground"
                                                    >
                                                        {t('password')}
                                                    </Label>
                                                    <div className="relative">
                                                        <Key className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <IGRPInputPassword
                                                            id="password"
                                                            name="password"
                                                            placeholder={t('passwordPlaceholder')}
                                                            value={password}
                                                            onChange={(value) => setPassword(value)}
                                                            className="pl-8 bg-background text-foreground placeholder-muted-foreground"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="token" className="mt-4">
                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="token"
                                                    className="text-muted-foreground"
                                                >
                                                    {t('token')}
                                                </Label>
                                                <div className="relative">
                                                    <Key className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <IGRPInputPassword
                                                        id="token"
                                                        name="token"
                                                        placeholder={t('tokenPlaceholder')}
                                                        value={token}
                                                        onChange={(value) => setToken(value)}
                                                        className="pl-8 bg-background text-foreground placeholder-muted-foreground"
                                                    />
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </div>
                            <Button
                                onClick={handleCloneProject}
                                className="w-full"
                                disabled={isCloning}
                            >
                                <GitFork className="w-4 h-4 mr-2" />
                                {isCloning ? t('cloningProject') : t('cloneProject')}
                            </Button>
                        </TabsContent>

                        <TabsContent value="search">
                            <RepositoryList />
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}
