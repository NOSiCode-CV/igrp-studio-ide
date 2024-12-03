import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { FolderOpen, GitFork, PlusCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import useToast from '@renderer/components/useToast'
import { navigateToNextPage, setBasePath, setConfig } from '@renderer/redux/thunks'
import { CreateProject } from './components/new-project-dialog'
import RecentsProjects from './components/recents-projects'

 const IDEInitialScreen = (): JSX.Element => {
  
  const { t } = useTranslation()

  const navigate = useNavigate()

  const dispatch: any = useDispatch()

  const { showErrorToast } = useToast()

  const onHandleOpenProjectClick = async (): Promise<void> => {
    const result = await window.api.openDirectory('')

    if (result.canceled) {
      return // User canceled the directory selection
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome to IGRP Studio</h1>
        <div className="flex space-x-4">
          <CreateProject/>
          <Button variant="outline">
            <GitFork className="w-4 h-4 mr-2" />
            {t('Clone Project')}
          </Button>
          <Button variant="outline" onClick={onHandleOpenProjectClick}>
            <FolderOpen className="w-4 h-4 mr-2" />
            {t('Open Project')}
          </Button>
        </div>
      </div>

      <RecentsProjects />
    </div>
  )
}

export default IDEInitialScreen