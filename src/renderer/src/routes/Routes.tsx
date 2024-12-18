import { ROUTES } from './routeConstants';
import React, { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import MainLayout from '@renderer/layouts/MainLayout'
import UiStudioLayout from '@renderer/layouts/UiStudioLayout'
import ApiStudioLayoput from '@renderer/layouts/ApiStudioLayoput'
import Loader from '@renderer/components/loader';

const IDEInitialScreen = lazy(() => import('@renderer/pages/home/ide-initial-screen'))
const PageBuilderApi = lazy(() => import('@renderer/generators/api'))
const PageBuilderUI = lazy(() => import('@renderer/generators/ui'))

const allRoutes = [
  {
    path: ROUTES.PATH_PAGE_BUILDER_UI,
    component: <PageBuilderUI />
  }
]

const apiRoutes = [
  {
    path: ROUTES.PATH_PAGE_BUILDER_API,
    component: <PageBuilderApi />
  }
]

const othersRoutes = [
  {
    path: ROUTES.PAHT_IDE_INITIAL_SCREEN,
    component: <IDEInitialScreen />
  }
]

function AppRoutes(): JSX.Element {
  return (
    <React.Fragment>
      <Suspense fallback={<Loader />}>
        <HashRouter
          future={{
            v7_relativeSplatPath: true,
            v7_startTransition: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to={ROUTES.PAHT_IDE_INITIAL_SCREEN} />} />
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
                element={<ApiStudioLayoput>{route.component}</ApiStudioLayoput>}
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
          </Routes>
        </HashRouter>
      </Suspense>
    </React.Fragment>
  )
}

export default AppRoutes
