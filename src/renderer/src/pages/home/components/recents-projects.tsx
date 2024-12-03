import { setConfig, setBasePath, navigateToNextPage } from '@renderer/redux/thunks'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { PageableProjects, Project } from 'src/main/types'
import { ENV_TYPES } from '@renderer/constants/appConstants'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Calendar, ChevronRight, Clock, FolderOpen, Search } from 'lucide-react'
import { LoadingSpinner } from '@renderer/components/loading-spinner'
import { EmptyState } from '@renderer/components/empty-state'
import { Button } from '@renderer/components/ui/button'
import { formatDate } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Input } from '@renderer/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'

const projectIcons = {
  [ENV_TYPES.NEXTJS]: 'https://www.svgrepo.com/show/354113/nextjs-icon.svg',
  [ENV_TYPES.SPRING]: 'https://www.svgrepo.com/show/354380/spring-icon.svg'
}

const RecentsProjects = (): JSX.Element => {
  const navigate = useNavigate()
  const dispatch: any = useDispatch()
  const { t } = useTranslation()

  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [allProjects, setProjects] = useState<PageableProjects>({ data: [], total: 0 })
  const [localProjects, setLocalProjects] = useState<Project[]>([])
  const [error, setError] = useState<string | null>(null)

  const [projectOrder, setProjectOrder] = useState<string>('lastModified')
  const [localProjectOrder, setLocalProjectOrder] = useState<string>('lastModified')
  const [remoteProjectOrder, setRemoteProjectOrder] = useState<string>('lastModified')

  const sortProjects = (projects) => {
    return [...projects].sort((a, b) => {
      if (projectOrder === 'name') {
        return a.name.localeCompare(b.name)
      } else if (projectOrder === 'lastModified') {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      }
      return 0
    })
  }

  const fetchProjects = async () => {
    setError(null)
    try {
      const res = await window.repo.project.findAllRecent()
      setProjects(res)
    } catch (err) {
      setError('Failed to fetch projects')
    } finally {
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    const localProjects = allProjects.data.filter(
      (project) => project?.location === undefined //|| project?.location === 'local'
    )
    setLocalProjects(localProjects)
  }, [allProjects])

  const handleOpenProject = async (p: Project): Promise<void> => {
    try {
      await window.repo.project.save(p)
    } catch (err) {}

    dispatch(setBasePath(p.path))

    dispatch(setConfig(p.config))

    navigateToNextPage(navigate, p.config)
  }

  /* const totalProjects = projects.total ?? 0;
    const requestedTotal = pagination.page * pagination.size; */

  const handleClear = async (projectRecent: Project, index: number): Promise<void> => {
    try {
      await window.repo.project.delete(projectRecent, index)
      fetchProjects()
    } catch (err) {
      setError('Failed to fetch projects')
    } finally {
    }
  }

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1500)
  }, [])

  const renderProjectCard = (project: Project, isCompact: boolean = false) => (
    <Card key={project.config.name} className={`flex flex-col ${isCompact ? 'p-2' : ''}`}>
      <CardHeader className={isCompact ? 'p-2' : ''}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img
              src={projectIcons[project.config.type]}
              alt={`${project.type} logo`}
              width={isCompact ? 16 : 20}
              height={isCompact ? 16 : 20}
              className="mr-2"
            />
            <CardTitle className={`${isCompact ? 'text-sm' : 'text-lg'}`}>
              {project.config.name}
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className={`flex-grow ${isCompact ? 'p-2' : ''}`}>
        {!isCompact && <p className="text-sm text-muted-foreground mb-2">{project.description}</p>}
        <div className="flex items-center text-xs text-muted-foreground">
          {project.dt_updated && (
            <>
              <Calendar className="w-3 h-3 mr-1" />
              <span>Last modified: {formatDate(project.dt_updated, 'MMM d, yyyy')}</span>
            </>
          )}
        </div>
      </CardContent>
      <CardContent className={`pt-0 ${isCompact ? 'p-2' : ''}`}>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => handleOpenProject(project)}
        >
          <FolderOpen className="w-3 h-3 mr-1" />
          <span className="text-xs">Open</span>
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <>
      <Card className="mb-6 bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Clock className="w-5 h-5 mr-2" />
            {t('recent')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : allProjects.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {allProjects.data.slice(0, 3).map((project) => renderProjectCard(project, true))}
            </div>
          ) : (
            <EmptyState
              message="No recent projects found. Start by creating a new project!"
              className="text-muted-foreground"
            />
          )}
        </CardContent>
      </Card>

      {/* All Projects Section */}
      <Card className="bg-card text-card-foreground">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-foreground">All Projects</CardTitle>
            <Tabs defaultValue="local">
              <TabsList>
                <TabsTrigger
                  value="local"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  Local Projects
                </TabsTrigger>
                <TabsTrigger
                  value="remote"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  GitHub/GitLab Projects
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="local">
            <TabsContent value="local">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5" />
                  <Input
                    type="text"
                    placeholder="Search local projects..."
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    className="pl-8 placeholder-muted-foreground"
                  />
                </div>
                <Select value={localProjectOrder} onValueChange={setLocalProjectOrder}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Order by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastModified">Last Modified</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isLoading ? (
                <LoadingSpinner />
              ) : localProjects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortProjects(
                    localProjects.filter(
                      (project) =>
                        project.config.name
                          .toLowerCase()
                          .includes(localSearchQuery.toLowerCase()) ||
                        project.config?.description
                          .toLowerCase()
                          .includes(localSearchQuery.toLowerCase())
                    )
                  ).map(renderProjectCard)}
                </div>
              ) : (
                <EmptyState
                  message="No local projects found. Start by creating a new project!"
                  className="text-muted-foreground"
                />
              )}
            </TabsContent>
            <TabsContent value="remote">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1 relative">
                  {/*  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" /> */}
                  <Input
                    type="text"
                    placeholder="Search remote projects..."
                    // value={remoteSearchQuery}
                    // onChange={(e) => setRemoteSearchQuery(e.target.value)}
                    className="pl-8 placeholder-muted-foreground"
                  />
                </div>
                <Select //value={remoteProjectOrder} onValueChange={setRemoteProjectOrder}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Order by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastModified">Last Modified</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                /* remoteProjects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortProjects(
                    remoteProjects.filter(
                      (project) =>
                        project.name.toLowerCase().includes(remoteSearchQuery.toLowerCase()) ||
                        project.description.toLowerCase().includes(remoteSearchQuery.toLowerCase())
                    )
                  ).map(renderProjectCard)}
                </div>
              ) :  */ <EmptyState
                  message="No remote projects found. Start by cloning a project from GitHub or GitLab!"
                  className="text-muted-foreground"
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  )
}

export default RecentsProjects
