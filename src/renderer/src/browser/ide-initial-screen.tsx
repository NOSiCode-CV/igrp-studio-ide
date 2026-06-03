import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import Loader from '@renderer/components/loader'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { ROUTES } from '@renderer/routes/routeConstants'
import CreateWorkspace from '@renderer/browser/workspaces/components/create-workspace'
import WorkspaceDiagram from '@renderer/browser/workspaces/views/workspace-diagram'
import { Container, FolderKanban, Network, Server, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Resources from './workspaces'
import WelcomeHeader from './workspaces/views/welcome-header'
import { WorkspaceDocker } from './workspaces/views/workspace-docker'
import { WorkspaceServices } from './workspaces/workspace-services'
import { WorkspaceSettings } from './workspaces/views/workspace-settings'

const IDEInitialScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    /** False until we know whether to stay on IDE (onboarding done) or redirect to /welcome */
    const [ideGateReady, setIdeGateReady] = useState(false)

    const {
        workspace,
        loading: workspacesLoading,
        state: { changeStatus }
    } = useWorkspace()

    useEffect(() => {
        if (workspacesLoading) {
            return
        }
        if (workspace) {
            setIdeGateReady(true)
            return
        }

        let cancelled = false
        void (async () => {
            try {
                const completed = await window.igrpStudioSettings.getWelcomeOnboardingCompleted()
                if (cancelled) return
                if (!completed) {
                    navigate(ROUTES.PATH_WELCOME_ONBOARDING, { replace: true })
                    return
                }
            } catch {
                if (!cancelled) {
                    navigate(ROUTES.PATH_WELCOME_ONBOARDING, { replace: true })
                }
                return
            }
            if (cancelled) return
            setIdeGateReady(true)
        })()
        return () => {
            cancelled = true
        }
    }, [workspacesLoading, workspace, navigate])

    const showBlockingCreateWorkspace = ideGateReady && !workspace && !workspacesLoading

    if (workspacesLoading || (!workspace && !ideGateReady)) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader />
            </div>
        )
    }

    return (
        <div className="mx-auto p-6 space-y-6 flex flex-col h-full">
            {showBlockingCreateWorkspace && (
                <CreateWorkspace open preventDismiss mode="dialog" onOpenChange={() => undefined} />
            )}
            {workspace ? (
                <>
                    <WelcomeHeader />
                    <Tabs defaultValue="resources">
                        <TabsList className="mb-3">
                            <TabsTrigger value="resources">
                                <FolderKanban className="h-3.5 w-3.5 mr-1.5" />
                                {t('resources')}
                            </TabsTrigger>
                            <TabsTrigger value="services">
                                <Server className="h-3.5 w-3.5 mr-1.5" />
                                {t('services')}
                            </TabsTrigger>
                            <TabsTrigger value="diagram">
                                <Network className="h-3.5 w-3.5 mr-1.5" />
                                {t('diagram')}
                            </TabsTrigger>
                            <TabsTrigger value="config">
                                <Container className="h-3.5 w-3.5 mr-1.5" />
                                {t('docker')}
                            </TabsTrigger>
                            <TabsTrigger value="settings">
                                <Settings className="h-3.5 w-3.5 mr-1.5" />
                                {t('settings')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="resources" className="mt-0 space-y-6">
                            {workspace && <Resources />}
                        </TabsContent>

                        <TabsContent
                            value="diagram"
                            className="mt-0 h-[calc(100vh-var(--header-height-two)-8rem)]"
                        >
                            <WorkspaceDiagram workspace={workspace} changeStatus={changeStatus} />
                        </TabsContent>

                        <TabsContent value="config" className="mt-0">
                            <WorkspaceDocker workspace={workspace} />
                        </TabsContent>

                        <TabsContent value="services" className="mt-0">
                            <WorkspaceServices workspaceId={workspace.id} />
                        </TabsContent>

                        <TabsContent value="settings" className="mt-0">
                            <WorkspaceSettings workspace={workspace} />
                        </TabsContent>
                    </Tabs>
                </>
            ) : null}
        </div>
    )
}

export default IDEInitialScreen
