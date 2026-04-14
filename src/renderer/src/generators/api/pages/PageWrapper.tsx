import { type TabItem, useTabs } from '@renderer/components/navigation/TabContext'
import { OPTION_TYPE, type OptionType } from '@renderer/constants/appConstants'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import type { FileTree, ProjectData } from 'src/main/types'
import { ControllerLayout } from './controller'
import ControllerOverview from './controller/overview'
import ERDLayout from './diagram'
import DtoLayout from './dto'
import { EditorLayout } from './EditorLayout'
import EmptyPage from './EmptyPage'
import { EnumLayout } from './enum'
import ModelLayout from './model'
import { ResponseLayout } from './response'

interface PageBuilderState {
    basePath: string
    currentItem: any
    filesThree: FileTree[]
    config: ProjectData
    responses: any[]
}

interface NewProps {
    onOpenNew: (tab: TabItem) => void
    open: OptionType | 'none'
    tab: TabItem
}

const componentMap = {
    [OPTION_TYPE.FILE_THREE]: EditorLayout,
    [OPTION_TYPE.MODEL]: ModelLayout,
    [OPTION_TYPE.ACTION]: ControllerLayout,
    [OPTION_TYPE.CONTROLLER]: ControllerOverview,
    [OPTION_TYPE.DATA_OBJECTS]: DtoLayout,
    [OPTION_TYPE.RESPONSE]: ResponseLayout,
    [OPTION_TYPE.ENUM]: EnumLayout,
    [OPTION_TYPE.ERDDiagram]: ERDLayout
}

const PageWrapper = ({ onOpenNew, open, tab }: NewProps) => {
    const [selectors, setSelectors] = useState<any[]>([])
    const [option, setOption] = useState<OptionType | 'none'>(open)
    const [module, setModule] = useState<string>('shared')

    const { t } = useTranslation()

    const { handleCloseTab } = useTabs()

    const selectState = (state: any): PageBuilderState => state.PageBuilder

    const selectProperties = createSelector(selectState, (studio) => {
        return {
            basePath: studio.basePath
        }
    })

    const { basePath } = useSelector(selectProperties)

    useEffect(() => {
        const getAllSelectors = async () => {
            try {
                const allSelectors = await window.api.fetchSelectors(module, basePath)
                setSelectors(allSelectors)
            } catch (error) {
                console.error(t('failedFetchSelectors'), error)
            }
        }

        if (basePath) {
            getAllSelectors()
        }
    }, [basePath, module])

    useEffect(() => {
        if (tab.item) setModule(tab.item.module || module)
    }, [tab])

    const handleOptionClick = (opt: OptionType | 'none') => {
        setOption(opt)
        onOpenNew({
            ...tab,
            open: opt
        })
    }

    const hangleClose = () => {
        handleCloseTab(tab.id)
    }

    const Component = option !== 'none' ? componentMap[option as keyof typeof componentMap] : null

    if (option === 'none') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-4 bg-background">
                <div className="w-full max-w-4xl space-y-8">
                    <EmptyPage
                        onClick={(option: string) => handleOptionClick(option as OptionType)}
                    />
                </div>
            </div>
        )
    }

    return (
        <>
            {Component && (
                <Component
                    key={tab.id}
                    selectors={selectors}
                    currentItem={tab.item}
                    onCloseTab={hangleClose}
                    basePath={basePath}
                />
            )}
        </>
    )
}

export default PageWrapper
