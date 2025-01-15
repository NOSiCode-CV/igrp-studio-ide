import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { FolderOpen, GitFork } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import useToast from '@renderer/components/useToast'
import { navigateToNextPage, setBasePath, setConfig } from '@renderer/redux/thunks'
import { CreateProject } from './components/new-project-dialog'
import RecentsProjects from './components/recents-projects'
import { PageHeader } from '@igrp/igrp-design-system'
import { RootState } from '@renderer/redux'
import UserDialog from '@renderer/components/user-dialog'

const IDEInitialScreen = (): JSX.Element => {
  const { t } = useTranslation()
  const { user } = useSelector((state: RootState) => state.git);
  const navigate = useNavigate()

  const dispatch: any = useDispatch()

  const { showErrorToast } = useToast()

  const onHandleOpenProjectClick = async (): Promise<void> => {
    const result = await window.api.openDirectory('')
    if (result.canceled) {
      return
    }

    if (!result.folderExists || !result.config?.type) {
      showErrorToast(t('notFoundProject'))
      return
    }

    dispatch(setBasePath(result.basePath))
    dispatch(setConfig(result.config))

    await window.repo.project.save({ config: result.config, path: result.basePath })

    // Navigate to the next page
    navigateToNextPage(navigate, result.config)
  }

  
  const handleGitHubLogin = () => {
    window.electron.ipcRenderer.send('github-oauth');
  };

  // const handleGitLabLogin = () => {
  //   window.electron.ipcRenderer.send('gitlab-oauth');
  // };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 mb-10">
      <PageHeader title="Welcome to IGRP Studio">
        <div className="flex justify-end space-x-3">
          <CreateProject />
          
          <Button variant="outline" onClick={onHandleOpenProjectClick}>
            <FolderOpen className="w-4 h-4 mr-2" />
            {t('Open Project')}
          </Button>
          {user ? (
            <UserDialog user={user} />
          ) : (
          <Button variant="outline" onClick={handleGitHubLogin}>
            <GitFork className="w-4 h-4 mr-2" />
            {t('Clone Project')}
          </Button>
          )}
        </div>
      </PageHeader>

      <RecentsProjects />

    </div>
  )
}

export default IDEInitialScreen
