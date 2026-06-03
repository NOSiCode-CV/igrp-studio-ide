import { TabProvider } from '@renderer/components/navigation/TabContext'
import type { JSX } from 'react'
import SpecificationLayout from './components/SpecificationLayout'
import { SpecificationProvider } from './contexts/SpecificationContext'

interface SpecificationGeneratorProps {
    basePath?: string
    currentItem?: any
}

const GeneratorSpecification = ({
    basePath,
    currentItem
}: SpecificationGeneratorProps): JSX.Element => {
    return (
        <TabProvider>
            <SpecificationProvider>
                <SpecificationLayout basePath={basePath} currentItem={currentItem} />
            </SpecificationProvider>
        </TabProvider>
    )
}

export default GeneratorSpecification
