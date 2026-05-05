import { TabProvider } from '@renderer/components/navigation/TabContext'
import { ROUTES } from '@renderer/routes/routeConstants'
import { EngineService } from '@renderer/services/EngineService'
import { type JSX, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ComponentsLoader } from './components/ComponentsLoader'
import TabManager from './components/TabManager'
import { ComponentsProvider } from './contexts/ComponentsContext'

interface PageBuilderProps {
    basePath?: string
}

const GeneratorUI = ({ basePath }: PageBuilderProps): JSX.Element => {
    const navigate = useNavigate()

    useEffect(() => {
        if (basePath === '' || basePath === undefined) {
            navigate(ROUTES.HOME)
        }

        if (basePath) EngineService.startWatching(basePath)
    }, [basePath, navigate])

    return (
        <TabProvider>
            <ComponentsProvider>
                <ComponentsLoader />
                {basePath && <TabManager basePath={basePath} />}
            </ComponentsProvider>
        </TabProvider>
    )
}

export default GeneratorUI
