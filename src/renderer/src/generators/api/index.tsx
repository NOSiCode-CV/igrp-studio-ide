import { TabProvider } from '@renderer/components/navigation/TabContext'
import TabManager from './components/TabManager'
import { JSX } from 'react'

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
