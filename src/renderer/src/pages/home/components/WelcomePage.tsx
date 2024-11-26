import { useTranslation } from 'react-i18next'
import RecentsProjects from './RecentsProjects'
import ProjectSelector from './ProjectSelector'
import Illustration from '@renderer/components/ilustration'
import { Button } from '@renderer/components/ui/button'
import { FolderOpen, GitFork, PlusCircle } from 'lucide-react'

interface SelectProjectProps {
  onHandleNewProjectClick?: () => void
}

const WelcomePage = ({
  onHandleNewProjectClick = (): void => {}
}: SelectProjectProps): JSX.Element => {
  const { t } = useTranslation()

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome to IGRP Studio</h1>
        <div className="flex space-x-4">
          <Button variant="default" onClick={onHandleNewProjectClick}>
            <PlusCircle className="w-4 h-4 mr-2" />
            New Project
          </Button>
          <Button variant="outline">
            <GitFork className="w-4 h-4 mr-2" />
            Clone Project
          </Button>
          <Button variant="outline">
            <FolderOpen className="w-4 h-4 mr-2" />
            Open Project
          </Button>
        </div>
      </div>

      <RecentsProjects />

 {/*      <div className="flex flex-wrap">
        <div className="w-full md:w-1/3 px-4">
          <div className="ml-5">
            <ProjectSelector onHandleNewProjectClick={onHandleNewProjectClick} />
          </div>
        </div>
      </div> */}
    </div>
  )
}

export default WelcomePage
