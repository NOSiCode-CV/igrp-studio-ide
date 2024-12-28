import { useEffect, useState } from 'react'
import ModelLayout from './components/model'
import DtoLayout from './components/dto'
import ControllerLayout from './components/controller'
import EmptyPage from './EmptyPage'
import { createSelector } from 'reselect'
import { useSelector, useDispatch } from 'react-redux'
import { setCurrentItem } from '@renderer/redux/thunks'
import { extractByType, getMergedFiles, getModulesArray } from './helpers'
import { OPTION_TYPE, OptionType } from '@renderer/constants/appConstants'
import { TabItem } from '@renderer/components/TabManager'
import { useTranslation } from 'react-i18next'

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
  currentItem: any
}

const New = ({ onOpenNew, open = 'none', tab, currentItem }: NewProps): JSX.Element => {
  const [selectors, setSelectors] = useState<any[]>([])
  const [currentData, setCurrentData] = useState<any>(null)
  const [option, setOption] = useState<OptionType>(open)
  const [module, setModule] = useState<string>('shared')

  const { t } = useTranslation()
  const dispatch: any = useDispatch()

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

  const { basePath, models, dto, modules } = useSelector(selectProperties)

  useEffect(() => {
    const getJsonData = async () => {
      if (!currentItem) return

      try {
        const data = await window.api.getJsonContent(currentItem.path)
        setCurrentData(data)
        setOption(currentItem.type)
        setModule(currentItem.module)
        dispatch(setCurrentItem(null))
      } catch (error) {
        console.error('Failed to load JSON content:', error)
      }
    }

    getJsonData()
  }, [currentItem, dispatch])

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

  const handleCancel = () => {
    setOption('none')
    setCurrentData(null)
  }

  const handleOptionClick = (opt: OptionType) => {
    setOption(opt)
    setModule('shared')
    setCurrentData(null)

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
            {' '}
            <EmptyPage onClick={handleOptionClick} />{' '}
          </div>
        </div>
      )}
      {option === OPTION_TYPE.MODELS && (
        <ModelLayout
          onCancel={handleCancel}
          basePath={basePath}
          selectors={selectors}
          jsonData={currentData}
          models={models}
          module={module}
        />
      )}
      {option === OPTION_TYPE.CONTROLLERS && (
        <ControllerLayout
          onCancel={handleCancel}
          basePath={basePath}
          selectors={selectors}
          jsonData={currentData}
          defaultModule={module}
          currentItem={currentItem}
          modules={modules}
        />
      )}
      {option === OPTION_TYPE.DATA_OBJECTS && (
        <DtoLayout
          onCancel={handleCancel}
          basePath={basePath}
          selectors={selectors}
          jsonData={currentData}
          dto={dto}
          models={models}
          module={module}
        />
      )}
    </>
  )
}

export default New
