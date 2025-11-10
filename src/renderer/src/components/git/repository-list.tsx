'use client'

import { useState, useEffect } from 'react'
import { Filter, AlertCircle, X } from 'lucide-react'
import {
  IGRPBadgePrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPScrollAreaPrimitive,
  IGRPSkeletonPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
import { Repository, RepositoryPlatform } from 'src/main/types'
import { ListGitProject } from './list-git-project'
import { PlatformIcon } from './platform-icon'
import useGitAuth from '@renderer/hooks/use-git-auth'
import { useGit } from '@renderer/hooks/use-git'
import { SearchInput } from '../shared-ui'
import { useTranslation } from 'react-i18next'
import useToast from '@renderer/hooks/useToast'
import { getUUID } from '@renderer/utils'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { useDispatch } from 'react-redux'
import { ProjectNameDialog } from './dialog-project-name'

export function RepositoryList() {
  const { t } = useTranslation()
  const { showErrorToast, showSuccessToast } = useToast()
  const {
    workspace,
    actions: { saveOrOpenProject }
  } = useWorkspace()
  const { repositoriesGitHub, repositoriesGitLab, isLoading } = useGitAuth()
  const { checkLocalProjects } = useGit()
  const dispatch: any = useDispatch()

  const [nameDialog, setNameDialog] = useState({
    isOpen: false,
    defaultName: '',
    onConfirm: (_name: string) => {}
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [filteredRepositories, setFilteredRepositories] = useState<Repository[]>([])
  const [platformFilter, setPlatformFilter] = useState<RepositoryPlatform | 'all'>('all')
  const [clonedRepos, setClonedRepos] = useState<number[]>([])
  const [projectPaths, setProjectPaths] = useState<Record<number, string>>({})
  const [isCloning, setIsCloning] = useState(false)
  const [cloningRepoId, setCloningRepoId] = useState<number | null>(null)

  useEffect(() => {
    setRepositories([...repositoriesGitHub, ...repositoriesGitLab])
    setFilteredRepositories([...repositoriesGitHub, ...repositoriesGitLab])
  }, [repositoriesGitHub, repositoriesGitLab])

  useEffect(() => {
    // Filter by platform first
    let platformFiltered = repositories
    if (platformFilter !== 'all') {
      platformFiltered = repositories.filter((repo) => repo.platform === platformFilter)
    }

    // Then filter by search query
    if (searchQuery.trim() === '') {
      setFilteredRepositories(platformFiltered)
    } else {
      const lowercaseQuery = searchQuery.toLowerCase()
      const filtered = platformFiltered.filter(
        (repo) =>
          repo.name.toLowerCase().includes(lowercaseQuery) ||
          repo.full_name.toLowerCase().includes(lowercaseQuery) ||
          (repo.description && repo.description.toLowerCase().includes(lowercaseQuery))
      )
      setFilteredRepositories(filtered)
    }
  }, [searchQuery, repositories, platformFilter])

  const handleClone = async (repo: Repository) => {
    if (isCloning) return

    setIsCloning(true)

    setCloningRepoId(repo.id)

    try {
      const projectPath = `/projects/${repo.name}`

      setClonedRepos((prev) => [...prev, repo.id])

      setProjectPaths((prev) => ({
        ...prev,
        [repo.id]: projectPath
      }))

      await window.electron.ipcRenderer.invoke(
        'clone-repository',
        repo.clone_url,
        `${workspace.path}${projectPath}`
      )
    } catch (error) {
      console.error('Failed to clone repository:', error)
    } finally {
      setIsCloning(false)
      setCloningRepoId(null)
    }
  }

  useEffect(() => {
    window.electron.ipcRenderer.on('clone-progress', async (_event: any, data: any) => {
      console.log(data)
      if (data.status === 'success' || data.status === 'error') {
        setCloningRepoId(null)
      }
      if (data.status === 'success') {
        showSuccessToast(t('repositoryClonedSuccessfully', { path: data.path }))
        try {
          const { project, path } = data
          const { config, type } = project

          await saveOrOpenProject({
            project: {
              workspaceId: workspace.id,
              name: config.name,
              framework: config.type,
              id: config.id || getUUID(),
              type,
              path,
              config
            },
            onSuccess: async () => {
              // This callback runs after the project is successfully saved
              await window.electron.ipcRenderer.invoke('add-cloned-repo', cloningRepoId)
              await window.electron.ipcRenderer.invoke('set-project-path', {
                repoId: cloningRepoId,
                path: data.path
              })

              // Update local states
              setClonedRepos((prevRepos) => [...prevRepos, cloningRepoId!])

              setProjectPaths((prevPaths) => ({
                ...prevPaths,
                [cloningRepoId!]: data.path
              }))
            }
          })
        } catch (error) {
          showErrorToast(t('failedOpenProjectAfterCloning'))
          console.error(t('errorOpeningProject'), error)
        }
      } else if (data.status === 'error') {
        showErrorToast(t('failedCloneRepository', { message: data.message }))
      }
    })

    window.electron.ipcRenderer.on(
      'request-project-name',
      (_event: any, { defaultName }: { defaultName: string }) => {
        setNameDialog({
          isOpen: true,
          defaultName,
          onConfirm: async (name) => {
            window.electron.ipcRenderer.send('project-name-response', name)
            setNameDialog((prev) => ({ ...prev, isOpen: false }))
          }
        })
      }
    )

    return () => {
      window.electron.ipcRenderer.removeAllListeners('clone-progress')
      window.electron.ipcRenderer.removeAllListeners('request-project-name')
    }
  }, [dispatch, showSuccessToast, showErrorToast, t, cloningRepoId])

  useEffect(() => {
    const loadClonedReposData = async () => {
      try {
        const [cloned, paths] = await Promise.all([
          window.electron.ipcRenderer.invoke('get-cloned-repos'),
          window.electron.ipcRenderer.invoke('get-project-paths')
        ])
        setClonedRepos(cloned)
        setProjectPaths(paths)
      } catch (error) {
        console.error(t('errorLoadingClonedReposData'), error)
        showErrorToast(t('failedLoadRepositoryData'))
      }
    }

    loadClonedReposData()
  }, [t, showErrorToast])

  useEffect(() => {
    const checkLocalProjectsExist = async () => {
      if (!repositoriesGitHub && !repositoriesGitLab) return

      // Check GitHub repositories
      if (repositoriesGitHub?.length > 0) {
        const githubResults = await checkLocalProjects(repositoriesGitHub)
        setClonedRepos((prev) => [...prev, ...Object.keys(githubResults).map(Number)])
        setProjectPaths((prev) => ({ ...prev, ...githubResults }))
      }

      // Check GitLab repositories
      if (repositoriesGitLab?.length > 0) {
        const gitlabResults = await checkLocalProjects(repositoriesGitLab)
        setClonedRepos((prev) => [...prev, ...Object.keys(gitlabResults).map(Number)])
        setProjectPaths((prev) => ({ ...prev, ...gitlabResults }))
      }
    }

    checkLocalProjectsExist()
  }, [repositoriesGitHub, repositoriesGitLab, checkLocalProjects])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <SearchInput
          placeholder="Search repositories..."
          value={searchQuery}
          className="w-full"
          onChange={(value) => setSearchQuery(value)}
        />
        <IGRPDropdownMenuPrimitive>
          <IGRPDropdownMenuTriggerPrimitive asChild>
            <IGRPButtonPrimitive variant="outline" size="sm" className="gap-1">
              <Filter className="h-4 w-4" />
              {t('filter')}
            </IGRPButtonPrimitive>
          </IGRPDropdownMenuTriggerPrimitive>
          <IGRPDropdownMenuContentPrimitive align="end">
            <IGRPDropdownMenuItemPrimitive onClick={() => setPlatformFilter('all')}>
              {t('allPlatforms')}
            </IGRPDropdownMenuItemPrimitive>
            <IGRPDropdownMenuItemPrimitive
              onClick={() => setPlatformFilter('github')}
              className="flex items-center gap-2"
            >
              <PlatformIcon platform="github" className="h-4 w-4" />
              {t('github')}
            </IGRPDropdownMenuItemPrimitive>
            <IGRPDropdownMenuItemPrimitive
              onClick={() => setPlatformFilter('gitlab')}
              className="flex items-center gap-2"
            >
              <PlatformIcon platform="gitlab" className="h-4 w-4" />
              {t('gitlab')}
            </IGRPDropdownMenuItemPrimitive>
          </IGRPDropdownMenuContentPrimitive>
        </IGRPDropdownMenuPrimitive>
      </div>

      {platformFilter !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{t('filterBy')}</span>
          <IGRPBadgePrimitive variant="default" className="flex items-center gap-1">
            <PlatformIcon platform={platformFilter} className="h-3 w-3" />
            {platformFilter === 'github' ? 'GitHub' : 'GitLab'}
            <IGRPButtonPrimitive
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => setPlatformFilter('all')}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">{t('removeFilter')}</span>
            </IGRPButtonPrimitive>
          </IGRPBadgePrimitive>
        </div>
      )}

      <div className="border rounded-md overflow-hidden">
        <IGRPScrollAreaPrimitive className="h-[400px]">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="p-4 flex items-center">
                  <IGRPSkeletonPrimitive className="h-10 w-10 rounded-full mr-4" />
                  <div className="space-y-2 flex-1">
                    <IGRPSkeletonPrimitive className="h-4 w-3/4" />
                    <IGRPSkeletonPrimitive className="h-3 w-1/2" />
                  </div>
                  <div className="flex gap-2">
                    <IGRPSkeletonPrimitive className="h-8 w-8 rounded-md" />
                    <IGRPSkeletonPrimitive className="h-8 w-20 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRepositories.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">{t('noRepositoriesFound')}</p>
              <p className="text-gray-400 text-sm mt-1">{t('tryAdjustingYourSearchOrFilters')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredRepositories.map((repo) => (
                <ListGitProject
                  key={repo.id}
                  repo={repo}
                  handleClone={handleClone}
                  clonedRepos={clonedRepos}
                  projectPaths={projectPaths}
                  isCloning={isCloning}
                />
              ))}
            </div>
          )}
        </IGRPScrollAreaPrimitive>
      </div>

      <ProjectNameDialog
        isOpen={nameDialog.isOpen}
        defaultName={nameDialog.defaultName}
        onClose={() => setNameDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={nameDialog.onConfirm}
      />
    </div>
  )
}
