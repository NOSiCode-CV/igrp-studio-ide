'use client'

import { Button } from '@renderer/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { useDocker } from '@renderer/hooks/use-docker'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { Edit, ExternalLink, MoreVertical, Play, Square } from 'lucide-react'
import { useState } from 'react'
import { ConfigurationDialog } from '../components/configuration-dialog'

interface ServiceActionsProps {
    service: any
    services: any[]
    onActionComplete?: () => Promise<void> | void
}

export const ServiceActions = ({ service, services, onActionComplete }: ServiceActionsProps) => {
    const [isEditService, setEditService] = useState(false)
    const { workspace } = useWorkspace()

    const { getServiceUrl, stopService, restartService, startContainers } = useDocker({
        workspace
    })

    const serviceUrl = getServiceUrl(service)

    const handleServiceUrl = () => {
        if (serviceUrl) {
            window.electron.ipcRenderer.send('open-external-url', serviceUrl)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_22px_56px_-16px_rgba(15,23,42,0.5)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                    {service.status === 'running' ? (
                        <DropdownMenuItem
                            onClick={async () => {
                                await stopService([service.name])
                                if (onActionComplete) {
                                    await onActionComplete()
                                }
                            }}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:text-rose-300 dark:focus:text-rose-300 dark:focus:bg-rose-900/30"
                        >
                            <Square className="mr-2 h-4 w-4 text-red-600 dark:text-rose-300" />
                            Stop
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem
                            onClick={async () => {
                                try {
                                    await restartService([service.name], 300)
                                } catch {
                                    await startContainers()
                                }
                                if (onActionComplete) {
                                    await onActionComplete()
                                }
                            }}
                            className="text-green-600 focus:text-green-600 focus:bg-green-50 dark:text-emerald-300 dark:focus:text-emerald-300 dark:focus:bg-emerald-900/30"
                        >
                            <Play className="mr-2 h-4 w-4 text-green-600 dark:text-emerald-300" />
                            Start
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                        className="focus:bg-slate-50 dark:focus:bg-slate-800"
                        onClick={() => {
                            setEditService(true)
                        }}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Service
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        className="focus:bg-slate-50 dark:focus:bg-slate-800"
                        onClick={handleServiceUrl}
                        disabled={!serviceUrl}
                    >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open in Browser
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfigurationDialog
                service={service}
                services={services}
                isNew={false}
                open={isEditService}
                setOpen={setEditService}
            >
                <span className="sr-only">Edit</span>
            </ConfigurationDialog>
        </>
    )
}
