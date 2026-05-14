import { TabProvider } from '@renderer/components/navigation/TabContext'
import { ROUTES } from '@renderer/routes/routeConstants'
import { EngineService } from '@renderer/services/EngineService'
import { type JSX, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ComponentsLoader } from './components/ComponentsLoader'
import TabManager from './components/TabManager'

interface PageBuilderProps {
    basePath?: string
}

// EngineCatalogProvider is mounted at the App root (see `src/renderer/src/App.tsx`)
// so non-UI surfaces (Specification Prototype, future generators) can read the
// engine catalog without bouncing through this generator. `ComponentsLoader`
// triggers the actual fetch when the UI generator opens.
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
            <ComponentsLoader />
            {basePath && <TabManager basePath={basePath} />}
        </TabProvider>
    )
}

export default GeneratorUI
