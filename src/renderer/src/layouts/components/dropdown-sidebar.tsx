import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import AlertDialogDelete from '@renderer/components/alert-dialog-delete'
import { OPTION_TYPE } from '@renderer/constants/appConstants'
import { useFramework } from '@renderer/hooks/use-framework'
import { useGit } from '@renderer/hooks/use-git'
import useToast from '@renderer/hooks/useToast'
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks'
import { Ellipsis, Plus } from 'lucide-react'
import React, { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import type { MenuItem } from 'src/main/types'
import type { DropdownItem } from './nav-data'

// Lazy load modal components
const DatabaseManagerModal = lazy(
    () => import('@renderer/generators/api/components/DatabaseManager')
)

const SerializationConfigModal = lazy(
    () => import('@renderer/generators/api/components/serialization-config')
)

interface DropdownSidebarMenuButtonProps {
    menuItem: MenuItem
    basePath?: string
}

// Modal manager component
const ModalManager: React.FC<{
    modalType: string
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    item: any
    basePath?: string
}> = ({ modalType, isOpen, setIsOpen, item, basePath }) => {
    const renderModal = () => {
        const props = {
            item,
            basePath,
            isOpen,
            setIsOpen
        }

        switch (modalType) {
            case 'database-manager':
                return <DatabaseManagerModal {...props} />
            case 'serialization-config':
                return <SerializationConfigModal {...props} />
            default:
                return null
        }
    }

    if (!isOpen) return null

    return <Suspense fallback={<div>Loading...</div>}>{renderModal()}</Suspense>
}

export const DropdownSidebarMenuButton: React.FC<DropdownSidebarMenuButtonProps> = ({
    menuItem,
    basePath
}) => {
    const [modalType, setModalType] = useState<string | null>(null)
    const [modalProps, setModalProps] = useState<Record<string, any>>({})
    const [isOpen, setIsOpen] = useState(false)
    const [isOpenDelete, setIsOpenDelete] = useState(false)
    const [item, setItem] = useState<any>(null)

    const { showErrorToast, showSuccessToast } = useToast()
    const { t } = useTranslation()
    const dispatch: any = useDispatch()
    const framework = useFramework()

    const { createGitCommit } = useGit()

    const handleDropdownClick = (item: any): void => {
        setItem(item)
        if (item.actionType === OPTION_TYPE.DELETE) {
            setIsOpenDelete(true)
        } else if (item.actionType === OPTION_TYPE.DUPLICATE) {
            handleDuplicate(item)
        } else if (item.modalType) {
            setModalType(item.modalType)
            setModalProps(item || {})
            setIsOpen(true)
        } else if (item.dropdownclick) {
            item.dropdownclick(item)
        }
    }

    const handleDuplicate = async (item: any): Promise<void> => {
        if (!item || !basePath) return

        try {
            // Special handling for actions - need to duplicate within the controller
            if (item.type === OPTION_TYPE.ACTION) {
                // Load the controller data
                const controllerData = await window.api.getJsonContent(item.path)
                if (!controllerData || !controllerData.actions) {
                    showErrorToast('Failed to load controller data')
                    return
                }

                // Find the action to duplicate
                const actionToDuplicate = item.content
                if (!actionToDuplicate || !actionToDuplicate.actionName) {
                    showErrorToast('Invalid action data')
                    return
                }

                // Create a deep copy of the action
                const duplicatedAction = JSON.parse(JSON.stringify(actionToDuplicate))

                // Generate a new action name with "Copy" suffix
                const originalActionName = duplicatedAction.actionName
                let newActionName = `${originalActionName}Copy`
                let counter = 1

                // Check if the name already exists and increment counter if needed
                const existingActions = controllerData.actions || []
                while (existingActions.some((action: any) => action.actionName === newActionName)) {
                    newActionName = `${originalActionName}Copy${counter}`
                    counter++
                }

                duplicatedAction.actionName = newActionName

                // Add the duplicated action to the controller
                const updatedActions = [...existingActions, duplicatedAction]
                const updatedController = {
                    ...controllerData,
                    actions: updatedActions
                }

                // Save the controller with the new action
                const { error } = await window.engine.createController(
                    updatedController,
                    framework,
                    basePath
                )

                if (error) {
                    showErrorToast(error)
                } else {
                    showSuccessToast(
                        t('duplicatedSuccess', { name: `${t('newAction')} ${originalActionName}` })
                    )
                    createGitCommit(
                        basePath,
                        `Duplicate action ${originalActionName} to ${newActionName}`
                    )
                    dispatch(onSetChangeStatus(true))
                }
            } else {
                // Standard duplication for other types
                const config = {
                    name: item.label,
                    type: item.type,
                    module: item.module,
                    content: item.content
                }

                const { error } = await window.engine.duplicate(config, framework, basePath)

                if (error) {
                    showErrorToast(error)
                } else {
                    showSuccessToast(t('duplicatedSuccess', { name: item.label }))
                    createGitCommit(basePath, `Duplicate ${item.label}`)
                    dispatch(onSetChangeStatus(true))
                }
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                showErrorToast(error.message)
            } else {
                showErrorToast(t('duplicateError', { name: item.label }))
            }
        }
    }

    const handleDelete = async (): Promise<void> => {
        if (!item || !basePath) return

        try {
            // Special handling for actions - need to delete from within the controller
            if (item.type === OPTION_TYPE.ACTION) {
                // Load the controller data
                const controllerData = await window.api.getJsonContent(item.path)
                if (!controllerData || !controllerData.actions) {
                    showErrorToast('Failed to load controller data')
                    return
                }

                // Find the action to delete
                const actionNameToDelete = item.content?.actionName || item.label
                const countActions = controllerData.actions.length

                if (countActions === 1) {
                    // If it's the last action, delete the entire controller
                    const config = {
                        name: controllerData.name,
                        type: 'controller',
                        module: item.module
                    }
                    const { error } = await window.engine.delete(config, framework, basePath)
                    if (error) {
                        showErrorToast(error)
                        return
                    }
                } else {
                    // Remove the action from the controller
                    const updatedActions = controllerData.actions.filter(
                        (action: any) => action.actionName !== actionNameToDelete
                    )
                    const updatedController = {
                        ...controllerData,
                        actions: updatedActions
                    }

                    // Save the controller without the deleted action
                    const { error } = await window.engine.createController(
                        updatedController,
                        framework,
                        basePath
                    )
                    if (error) {
                        showErrorToast(error)
                        return
                    }
                }

                showSuccessToast(
                    t('deletedSuccess', { name: `${t('newAction')} ${actionNameToDelete}` })
                )
                createGitCommit(basePath, `Delete action ${actionNameToDelete}`)
                dispatch(onSetChangeStatus(true))
            } else if (
                item.type === OPTION_TYPE.GRAPHQL_QUERY ||
                item.type === OPTION_TYPE.GRAPHQL_MUTATION ||
                item.type === OPTION_TYPE.GRAPHQL_SUBSCRIPTION
            ) {
                const operationId = item.content?.id || item.id

                if (!operationId) {
                    showErrorToast('Invalid GraphQL operation')
                    return
                }

                await window.graphql.deleteGraphQLOperation(basePath, item.module, operationId)
                showSuccessToast(t('deletedSuccess', { name: item.label }))
                createGitCommit(basePath, `Delete GraphQL operation ${item.label}`)
                dispatch(onSetChangeStatus(true))
            } else {
                // Standard deletion for other types
                const config = {
                    name: item.label,
                    type: item.type,
                    module: item.module
                }

                const { error } = await window.engine.delete(config, framework, basePath)

                if (error) {
                    showErrorToast(error)
                } else {
                    showSuccessToast(t('deletedSuccess', { name: item.label }))
                    createGitCommit(basePath, `Delete ${item.label}`)
                    dispatch(onSetChangeStatus(true))
                }
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                showErrorToast(error.message)
            } else {
                showErrorToast(t('duplicateError', { name: item.label }))
            }
        }
    }

    const isDeleteAction = (menuItem.dropdownMenus ?? []).some(
        (menu: any) => menu.actionType === OPTION_TYPE.DELETE
    )

    return (menuItem.dropdownMenus ?? []).length === 0 ? (
        <></>
    ) : (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="text-muted-foreground hover:text-foreground">
                        {isDeleteAction ? (
                            <Ellipsis className="h-4 w-4" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="min-w-56">
                    {(menuItem.dropdownMenus ?? []).map((menu: DropdownItem, idx: number) => {
                        const isDelete = menu.actionType === OPTION_TYPE.DELETE
                        return (
                            <React.Fragment key={idx}>
                                {menu.actionType === OPTION_TYPE.DELETE && (
                                    <DropdownMenuSeparator />
                                )}
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        const actionId = `new-action-${menuItem.id || menuItem.label}`
                                        handleDropdownClick({
                                            ...menuItem,
                                            ...menu,
                                            isNew: menu.isNew ?? true,
                                            id: actionId
                                        })
                                    }}
                                    variant={isDelete ? 'destructive' : 'default'}
                                >
                                    {menu.icon ? (
                                        <menu.icon className={'h-4'} />
                                    ) : (
                                        <span className="h-4 me-4"></span>
                                    )}
                                    {menu.label}
                                    {isDelete && <DropdownMenuShortcut>⌘+D</DropdownMenuShortcut>}
                                </DropdownMenuItem>
                            </React.Fragment>
                        )
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            {modalType && (
                <ModalManager
                    modalType={modalType}
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    item={modalProps}
                    basePath={basePath}
                />
            )}

            <AlertDialogDelete
                isOpen={isOpenDelete}
                onConfirm={handleDelete}
                onClose={(open) => {
                    setIsOpenDelete(open)
                }}
                hasTrigger={false}
            />
        </>
    )
}
