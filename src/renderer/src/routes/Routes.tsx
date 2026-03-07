import Loader from '@renderer/components/loader'
import GeneratorAPI from '@renderer/generators/api'
import GeneratorUI from '@renderer/generators/ui'
import ApiStudioLayout from '@renderer/layouts/ApiStudioLayout'
import MainLayout from '@renderer/layouts/MainLayout'
import UiStudioLayout from '@renderer/layouts/UiStudioLayout'
import AppLogicPage from '@renderer/pages/applogic/app-logic'
import Connections from '@renderer/pages/connections'
import IDEInitialScreen from '@renderer/pages/ide-initial-screen'
import ProjectSettings from '@renderer/pages/project/project-settings'
import React, { type JSX, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from './routeConstants'

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
        path: ROUTES.PAHT_IDE_INITIAL_SCREEN,
        component: <IDEInitialScreen />
    },
    {
        path: ROUTES.HOME,
        component: <IDEInitialScreen />
    },
    {
        path: ROUTES.PATH_IDE_APP_LOGIC,
        component: <AppLogicPage />
    },
    {
        path: ROUTES.PATH_CONNECTIONS,
        component: <Connections />
    }
]

function AppRoutes(): JSX.Element {
    return (
        <React.Fragment>
            <Suspense fallback={<Loader />}>
                <HashRouter>
                    <Routes>
                        <Route
                            path="/"
                            element={<Navigate to={ROUTES.PAHT_IDE_INITIAL_SCREEN} replace />}
                        />
                        {allRoutes.map((route, idx) => (
                            <Route
                                path={route.path}
                                element={<UiStudioLayout>{route.component}</UiStudioLayout>}
                                key={idx}
                            />
                        ))}
                        {apiRoutes.map((route, idx) => (
                            <Route
                                path={route.path}
                                element={<ApiStudioLayout>{route.component}</ApiStudioLayout>}
                                key={idx}
                            />
                        ))}
                        {othersRoutes.map((route, idx) => (
                            <Route
                                path={route.path}
                                element={<MainLayout>{route.component}</MainLayout>}
                                key={idx}
                            />
                        ))}
                        {/* Catch-all route to redirect invalid routes to initial screen */}
                        <Route
                            path="*"
                            element={<Navigate to={ROUTES.PAHT_IDE_INITIAL_SCREEN} replace />}
                        />
                    </Routes>
                </HashRouter>
            </Suspense>
        </React.Fragment>
    )
}

export default AppRoutes
