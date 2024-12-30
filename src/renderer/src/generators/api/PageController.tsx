import { useEffect, useState } from 'react'
import ModelLayout from './components/model'
import DtoLayout from './components/dto'
import ControllerLayout from './components/controller'
import EmptyPage from './EmptyPage'
import { createSelector } from 'reselect'
import { useSelector } from 'react-redux'
import { extractByType, getMergedFiles, getModulesArray } from './helpers'
import { OPTION_TYPE, OptionType } from '@renderer/constants/appConstants'
import { TabItem } from '@renderer/components/TabManager'
import { useTranslation } from 'react-i18next'
import ControllerOverview from './components/controller/overview'

interface PageBuilderState {
  basePath: string
  currentItem: any
  folderFiles: {
    models?: any[]
    dto?: any[]
  }
}

interface NewProps {
  onOpenNew: (tab: TabItem) => void
  open: OptionType
  tab: TabItem
}

const PageController = ({ onOpenNew, open, tab }: NewProps): JSX.Element => {
  const [selectors, setSelectors] = useState<any[]>([])
  const [option, setOption] = useState<OptionType>(open)
  const [module, setModule] = useState<string>('shared')

  const { t } = useTranslation()

  const selectState = (state: any): PageBuilderState => state.PageBuilder

  const selectProperties = createSelector(selectState, (studio) => {
    const moduleData = getMergedFiles(studio, module)
    return {
      basePath: studio.basePath,
      models: extractByType(moduleData, OPTION_TYPE.MODELS),
      dto: extractByType(moduleData, OPTION_TYPE.DATA_OBJECTS),
      controllers: extractByType(moduleData, OPTION_TYPE.CONTROLLERS),
      modules: getModulesArray(studio.folderFiles)
    }
  })

  const { basePath, models, dto, modules, controllers } = useSelector(selectProperties)

  useEffect(() => {
    const getAllSelectors = async () => {
      try {
        const allSelectors = await window.api.fetchSelectors(module, basePath)
        setSelectors(allSelectors)
      } catch (error) {
        console.error('Failed to fetch selectors:', error)
      }
    }

    if (basePath) {
      getAllSelectors()
    }
  }, [basePath, module])

  const handleOptionClick = (opt: OptionType) => {
    setOption(opt)
    setModule('shared')

    onOpenNew({
      ...tab,
      title: t(`new${opt.charAt(0).toUpperCase() + opt.slice(1)}`),
      open: opt
    })
  }

  return (
    <>
      {option === 'none' && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-4 bg-background">
          <div className="w-full max-w-4xl space-y-8">
            <EmptyPage onClick={handleOptionClick} />
          </div>
        </div>
      )}
      {option === OPTION_TYPE.MODELS && (
        <ModelLayout
          basePath={basePath}
          selectors={selectors}
          models={models}
          module={module}
          currentItem={tab.item}
        />
      )}
      {option === OPTION_TYPE.ACTION && (
        <ControllerLayout
          basePath={basePath}
          selectors={selectors}
          defaultModule={module}
          currentItem={tab.item}
          modules={modules}
        />
      )}
      {option === OPTION_TYPE.CONTROLLERS && (
        <ControllerOverview
          basePath={basePath}
          currentItem={tab.item}
          controllers={controllers}
        />
      )}
      {option === OPTION_TYPE.DATA_OBJECTS && (
        <DtoLayout
          basePath={basePath}
          selectors={selectors}
          dto={dto}
          models={models}
          module={module}
          currentItem={tab.item}
        />
      )}
    </>
  )
}

export default PageController
