import { ROUTES } from './routeConstants';
import React, { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import Loader from '@renderer/components/loader'
import MainLayout from '@renderer/layouts/MainLayout'
import UiStudioLayout from '@renderer/layouts/UiStudioLayout'
import ApiStudioLayoput from '@renderer/layouts/ApiStudioLayoput'

const IGRP = lazy(() => import('@renderer/pages/home/IGRP'))
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
    path: '/igrp',
    component: <IGRP />
  }
]

function AppRoutes(): JSX.Element {
  return (
    <React.Fragment>
      <Suspense fallback={<Loader />}>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/igrp" />} />
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
