import { useEffect, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { PlusCircle, MoreHorizontal } from 'lucide-react'
import FormNewProjectNextJS from './new-project-nextjs'
import FormNewProjectSpring from './new-project-springboot'
import { HandlerResponse } from 'src/main/types'

export function CreateProject() {
  const [open, setOpen] = useState(false)
  const [versions, setVersions] = useState({})

  const projectIcons = {
    nextjs: 'https://www.svgrepo.com/show/354113/nextjs-icon.svg',
    springboot: 'https://www.svgrepo.com/show/354380/spring-icon.svg',
    aspnet: 'https://www.christianfindlay.com/assets/images/blog/dotnet/logo.svg',
    vuejs: 'https://www.svgrepo.com/show/354528/vue.svg',
    angular: 'https://www.svgrepo.com/show/353396/angular-icon.svg',
    laravel: 'https://www.svgrepo.com/show/353985/laravel.svg',
    django: 'https://www.svgrepo.com/show/353657/django-icon.svg'
  }

  const mainFrameworks = ['nextjs', 'springboot']
  const additionalFrameworks = ['aspnet', 'vuejs', 'angular', 'laravel', 'django']

  useEffect(() => {
    const getVersions = async () => {
      const data: HandlerResponse = await window.api.getVersions(
        'https://sonatype.nosi.cv/service/rest/v1/search?repository=igrp-framework&group=cv.igrp&name=core'
      )

      const options = data.result.map((value) => {
        return {
          label: value,
          value: value
        }
      })

      setVersions(options)
    }
    getVersions()
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <PlusCircle className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:w-[540px] sm:max-w-[75vw] lg:max-w-[960px] bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Project</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="nextjs">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="flex-grow grid grid-cols-2 max-w-none bg-muted dark:bg-gray-700">
              {mainFrameworks.map((framework) => (
                <TabsTrigger
                  key={framework}
                  value={framework}
                  className="flex items-center justify-center text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background"
                >
                  <img
                    src={projectIcons[framework]}
                    alt={framework}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  {framework.charAt(0).toUpperCase() + framework.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="ml-2">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {additionalFrameworks.map((framework) => (
                  <DropdownMenuItem key={framework}>
                    <img
                      src={projectIcons[framework]}
                      alt={framework}
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    {framework.charAt(0).toUpperCase() + framework.slice(1)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <TabsContent value="nextjs">
            <FormNewProjectNextJS />
          </TabsContent>
          <TabsContent value="springboot">
            <FormNewProjectSpring versions={versions} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
