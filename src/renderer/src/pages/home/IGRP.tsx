import React, { useState } from 'react'
import SelectEnvironment from '@renderer/pages/home/components/SelectEnvironment'
import FormNewProjectNextJS from '@renderer/pages/home/components/FormNewProjectNextJS'
import FormNewProjectSpring from '@renderer/pages/home/components/FormNewProjectSpring'
import { ENV_TYPES } from '@renderer/utils/constants';
import WelcomePage from './components/WelcomePage';

const componentMap = {
  [ENV_TYPES.NEXTJS]: FormNewProjectNextJS,
  [ENV_TYPES.SPRING]: FormNewProjectSpring,
};

function IGRP(): JSX.Element {

  const [projectType, setProjectType] = useState('')
  const [showSelectProject, setShowSelectProject] = useState(true)
  const [showSelectEnv, setShowSelectEnv] = useState(false)
  const [showFormNewProject, setShowFormNewProject] = useState(false)

  const SelectedFormComponent = componentMap[projectType];

  const handleNewProjectClick = (): void => {
    setShowSelectEnv(!showSelectEnv)
    setShowSelectProject(!showSelectProject)
  }

  const handleEnvironmentCardClick = (type: string): void => {
    toggleFormAndResetEnvironment();
    setProjectType(type);
  }

  const handleBackButtonClick = (): void => {
    if (showSelectEnv) handleNewProjectClick()
    if (showFormNewProject) {
      setShowFormNewProject(!showFormNewProject)
      toggleFormAndResetEnvironment()
    }
  }

  const toggleFormAndResetEnvironment = (): void => {
    setShowFormNewProject(!showFormNewProject);
    setShowSelectEnv(!showSelectEnv);
  };

  return (
    <div className="container mx-auto px-4">
      {showSelectProject && (
        <>
          <WelcomePage onHandleNewProjectClick={handleNewProjectClick} />
        </>
      )}
      {showSelectEnv && (
        <>
          <SelectEnvironment
            onEnvironmentCardClick={handleEnvironmentCardClick}
            onBackButtomClick={handleBackButtonClick}
          />
        </>
      )}
      {showFormNewProject && (
        <>
          <SelectedFormComponent onBackButtonClick={handleBackButtonClick} />
        </>
      )}
    </div>
  )
}

export default IGRP
