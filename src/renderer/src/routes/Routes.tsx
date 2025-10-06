import { ROUTES } from './routeConstants';
import React, { JSX, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import MainLayout from '@renderer/layouts/MainLayout';
import UiStudioLayout from '@renderer/layouts/UiStudioLayout';
import ApiStudioLayoput from '@renderer/layouts/ApiStudioLayout';
import Loader from '@renderer/components/loader';
import ProjectSettings from '@renderer/pages/project/project-settings';
import IDEInitialScreen from '@renderer/pages/ide-initial-screen';
import AppLogicPage from '@renderer/pages/applogic/app-logic';
import Connections from '@renderer/pages/connections';
import GeneratorUI from '@renderer/generators/ui';
import GeneratorAPI from '@renderer/generators/api';

/* const IDEInitialScreen = lazy(
    () => import('@renderer/pages/ide-initial-screen')
);
const PageBuilderApi = lazy(() => import('@renderer/generators/api'));
const ProjectSettings = lazy(
    () => import('@renderer/pages/project/project-settings')
);
const Connections = lazy(() => import('@renderer/pages/connections'));
const PageBuilderUI = lazy(() => import('@renderer/generators/ui'));
const AppLogicPage = lazy(() => import('@renderer/pages/applogic/app-logic')); */

const allRoutes = [
    {
        path: ROUTES.PATH_PAGE_BUILDER_UI,
        component: <GeneratorUI />,
    },
];

const apiRoutes = [
    {
        path: ROUTES.PATH_PAGE_BUILDER_API,
        component: <GeneratorAPI />,
    },
    {
        path: '/project-settings',
        component: <ProjectSettings />,
    },
];

const othersRoutes = [
    {
        path: ROUTES.PAHT_IDE_INITIAL_SCREEN,
        component: <IDEInitialScreen />,
    },
    {
        path: ROUTES.PATH_IDE_APP_LOGIC,
        component: <AppLogicPage />,
    },
    {
        path: '/connections',
        component: <Connections />,
    },
];

function AppRoutes(): JSX.Element {
    return (
        <React.Fragment>
            <Suspense fallback={<Loader />}>
                <HashRouter>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Navigate to={ROUTES.PAHT_IDE_INITIAL_SCREEN} />
                            }
                        />
                        {allRoutes.map((route, idx) => (
                            <Route
                                path={route.path}
                                element={
                                    <UiStudioLayout>
                                        {route.component}
                                    </UiStudioLayout>
                                }
                                key={idx}
                            />
                        ))}
                        {apiRoutes.map((route, idx) => (
                            <Route
                                path={route.path}
                                element={
                                    <ApiStudioLayoput>
                                        {route.component}
                                    </ApiStudioLayoput>
                                }
                                key={idx}
                            />
                        ))}
                        {othersRoutes.map((route, idx) => (
                            <Route
                                path={route.path}
                                element={
                                    <MainLayout>{route.component}</MainLayout>
                                }
                                key={idx}
                            />
                        ))}
                    </Routes>
                </HashRouter>
            </Suspense>
        </React.Fragment>
    );
}

export default AppRoutes;
