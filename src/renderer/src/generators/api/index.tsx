import { TabProvider } from '@renderer/components/navigation/TabContext'
import type { JSX } from 'react'
import TabManager from './components/TabManager'

interface PageBuilderProps {
    basePath?: string
    currentItem?: any
}

const GeneratorAPI = ({ basePath, currentItem }: PageBuilderProps): JSX.Element => {
    return (
        <TabProvider>
            <TabManager basePath={basePath} currentItem={currentItem} />
        </TabProvider>
    )
}

export default GeneratorAPI
