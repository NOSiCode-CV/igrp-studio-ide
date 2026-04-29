'use client'

import {
    IGRPButtonPrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import AlertDialogDelete from '@renderer/components/alert-dialog-delete'
import { useDocker } from '@renderer/hooks/use-docker'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import useToast from '@renderer/hooks/useToast'
import { Edit, ExternalLink, MoreVertical, Play, Square, Trash } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfigurationDialog } from '../components/configuration-dialog'

interface ServiceActionsProps {
    service: any
    services: any[]
}

export const ServiceActions = ({ service, services }: ServiceActionsProps) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditService, setEditService] = useState(false)
    const { showErrorToast } = useToast()
    const {
        workspace,
        actions: { removeService }
    } = useWorkspace()

    const { getServiceUrl, stopService, restartService } = useDocker({
        workspace
    })

    const { t } = useTranslation()

    const handleServiceUrl = () => {
        const url = getServiceUrl(service)
        if (url) {
            window.electron.ipcRenderer.send(t('openExternalUrl'), url)
        }
    }

    const handleDelete = async () => {
        setIsDialogOpen(false)
        try {
            await removeService(service.labels.uuid)
        } catch (error: unknown) {
            showErrorToast(error)
        }
    }

    return (
        <>
            <IGRPDropdownMenuPrimitive>
                <IGRPDropdownMenuTriggerPrimitive asChild>
                    <IGRPButtonPrimitive variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                    </IGRPButtonPrimitive>
                </IGRPDropdownMenuTriggerPrimitive>
                <IGRPDropdownMenuContentPrimitive align="end" className="w-48">
                    {service.status === 'running' ? (
                        <IGRPDropdownMenuItemPrimitive
                            onClick={() => {
                                stopService([service.name])
                            }}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                            <Square className="mr-2 h-4 w-4 text-red-600" />
                            {t('stopService')}
                        </IGRPDropdownMenuItemPrimitive>
                    ) : (
                        <IGRPDropdownMenuItemPrimitive
                            onClick={() => {
                                restartService([service.name], 300)
                            }}
                            className="text-green-600 focus:text-green-600 focus:bg-green-50"
                        >
                            <Play className="mr-2 h-4 w-4 text-green-600" />
                            {t('startService')}
                        </IGRPDropdownMenuItemPrimitive>
                    )}

                    <IGRPDropdownMenuItemPrimitive
                        className="focus:bg-accent"
                        onClick={() => {
                            setEditService(true)
                        }}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        {t('editService')}
                    </IGRPDropdownMenuItemPrimitive>

                    {getServiceUrl(service) && (
                        <IGRPDropdownMenuItemPrimitive onClick={handleServiceUrl}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {t('openInBrowser')}
                        </IGRPDropdownMenuItemPrimitive>
                    )}

                    {service.labels?.uuid && (
                        <IGRPDropdownMenuItemPrimitive
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => {
                                setIsDialogOpen(true)
                            }}
                        >
                            <Trash className="mr-2 h-4 w-4 text-red-600" />
                            {t('removeService')}
                        </IGRPDropdownMenuItemPrimitive>
                    )}
                </IGRPDropdownMenuContentPrimitive>
            </IGRPDropdownMenuPrimitive>

            <AlertDialogDelete
                onConfirm={handleDelete}
                onClose={() => setIsDialogOpen(false)}
                recordId={service.name}
                isOpen={isDialogOpen}
            />

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
