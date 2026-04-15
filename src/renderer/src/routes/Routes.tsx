import Loader from '@renderer/components/loader'
import ApiStudioLayout from '@renderer/layouts/ApiStudioLayout'
import MainLayout from '@renderer/layouts/MainLayout'
import UiStudioLayout from '@renderer/layouts/UiStudioLayout'
import Connections from '@renderer/pages/connections'
import IDEInitialScreen from '@renderer/pages/ide-initial-screen'
import ProjectSettings from '@renderer/pages/project/project-settings'
import React, { type JSX, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from './routeConstants'

const GeneratorUI = React.lazy(() => import('@renderer/generators/ui'))
const GeneratorAPI = React.lazy(() => import('@renderer/generators/api'))

const allRoutes = [
    {
        path: ROUTES.PATH_PAGE_BUILDER_UI,
        component: <GeneratorUI />
    }
]

const apiRoutes = [
    {
        path: ROUTES.PATH_PAGE_BUILDER_API,
        component: <GeneratorAPI />
    },
    {
        path: ROUTES.PATH_PROJECT_SETTINGS,
        component: <ProjectSettings />
    }
]

const othersRoutes = [
    {
        path: ROUTES.PATH_IDE_INITIAL_SCREEN,
        component: <IDEInitialScreen />
    },
    {
        path: ROUTES.HOME,
        component: <IDEInitialScreen />
    },
    {
        path: ROUTES.PATH_CONNECTIONS,
        component: <Connections />
    }
]

function AppRoutes(): JSX.Element {
    return (
        <Suspense fallback={<Loader />}>
            <HashRouter>
                <Routes>
                    <Route
                        path="/"
                        element={<Navigate to={ROUTES.PATH_IDE_INITIAL_SCREEN} replace />}
                    />
                    {allRoutes.map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={<UiStudioLayout>{route.component}</UiStudioLayout>}
                        />
                    ))}
                    {apiRoutes.map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={<ApiStudioLayout>{route.component}</ApiStudioLayout>}
                        />
                    ))}
                    {othersRoutes.map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={<MainLayout>{route.component}</MainLayout>}
                        />
                    ))}
                    <Route
                        path="*"
                        element={<Navigate to={ROUTES.PATH_IDE_INITIAL_SCREEN} replace />}
                    />
                </Routes>
            </HashRouter>
        </Suspense>
    )
}

export default AppRoutes