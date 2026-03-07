import {
    IGRPButtonPrimitive,
    IGRPCardContentPrimitive,
    IGRPCardDescriptionPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardPrimitive,
    IGRPCardTitlePrimitive,
    IGRPCombobox,
    IGRPInputPrimitive,
    IGRPLabelPrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { PermissionsConfig } from '@igrp/igrp-studio-springboot-engine/types'
import { X } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface TabSecurityProps {
    formik: any
    basePath: string
    module?: string
}

export const TabSecurity: React.FC<TabSecurityProps> = ({ formik, basePath, module }) => {
    const { t } = useTranslation()
    const [availablePermissions, setAvailablePermissions] = useState<
        { label: string; value: string }[]
    >([])
    const [permissionInput, setPermissionInput] = useState('')
    const [roleInput, setRoleInput] = useState('')
    const [loadingPermissions, setLoadingPermissions] = useState(false)

    const permission = formik.values.permission as PermissionsConfig | undefined
    const roles = (formik.values.roles as string[]) || []

    // Load available permissions from engine
    useEffect(() => {
        const loadPermissions = async (): Promise<void> => {
            try {
                setLoadingPermissions(true)
                // Try to load permissions from engine
                // For now, we'll use an empty array if the method doesn't exist
                // This can be enhanced later when the engine method is available
                if (window.engine && typeof (window.engine as any).getPermissions === 'function') {
                    const result = await (window.engine as any).getPermissions(basePath)
                    if (result && !result.error && Array.isArray(result.data)) {
                        setAvailablePermissions(result.data)
                    }
                }
                console.log('loadingPermissions', loadingPermissions)
            } catch (error) {
                console.warn('Could not load permissions:', error)
                // Continue with empty array - user can still manually enter permissions
            } finally {
                setLoadingPermissions(false)
            }
        }

        if (basePath) {
            loadPermissions()
        }
    }, [basePath, module])

    const handlePermissionOperatorChange = (operator: 'AND' | 'OR'): void => {
        const currentPermission = permission || { items: [], operator: 'OR' }
        formik.setFieldValue('permission', {
            ...currentPermission,
            operator
        })
    }

    const handleAddPermission = (): void => {
        if (!permissionInput.trim()) return

        const currentPermission = permission || { items: [], operator: 'OR' }
        const newItems = [...(currentPermission.items || []), permissionInput.trim()]

        formik.setFieldValue('permission', {
            ...currentPermission,
            items: newItems
        })
        setPermissionInput('')
    }

    const handleRemovePermission = (permissionToRemove: string): void => {
        const currentPermission = permission || { items: [], operator: 'OR' }
        const newItems = (currentPermission.items || []).filter((p) => p !== permissionToRemove)

        if (newItems.length === 0) {
            formik.setFieldValue('permission', undefined)
        } else {
            formik.setFieldValue('permission', {
                ...currentPermission,
                items: newItems
            })
        }
    }

    const handleAddRole = (): void => {
        if (!roleInput.trim()) return

        const newRoles = [...roles, roleInput.trim()]
        formik.setFieldValue('roles', newRoles)
        setRoleInput('')
    }

    const handleRemoveRole = (roleToRemove: string): void => {
        const newRoles = roles.filter((r) => r !== roleToRemove)
        formik.setFieldValue('roles', newRoles.length > 0 ? newRoles : [])
    }

    const handlePermissionSelect = (value: string): void => {
        if (!value) return

        const currentPermission = permission || { items: [], operator: 'OR' }
        const newItems = [...(currentPermission.items || []), value]

        formik.setFieldValue('permission', {
            ...currentPermission,
            items: newItems
        })
    }

    const permissionItems = permission?.items || []
    const permissionOperator = permission?.operator || 'OR'

    return (
        <div className="space-y-4">
            {/* Permissions Section */}
            <IGRPCardPrimitive>
                <IGRPCardHeaderPrimitive>
                    <IGRPCardTitlePrimitive>
                        {t('permissions') || 'Permissions'}
                    </IGRPCardTitlePrimitive>
                    <IGRPCardDescriptionPrimitive>
                        {t('configurePermissions') ||
                            'Configure the permissions required to access this action. Use AND to require all permissions, OR to require at least one.'}
                    </IGRPCardDescriptionPrimitive>
                </IGRPCardHeaderPrimitive>
                <IGRPCardContentPrimitive className="space-y-4">
                    {/* Permission Operator */}
                    {permissionItems.length > 0 && (
                        <div className="space-y-2">
                            <IGRPLabelPrimitive>
                                {t('permissionOperator') || 'Permission Operator'}
                            </IGRPLabelPrimitive>
                            <IGRPCombobox
                                options={[
                                    {
                                        label: `OR ${t('anyPermission') || '(Any permission)'}`,
                                        value: 'OR'
                                    },
                                    {
                                        label: `AND ${t('allPermissions') || '(All permissions)'}`,
                                        value: 'AND'
                                    }
                                ]}
                                value={permissionOperator}
                                onChange={(value) =>
                                    handlePermissionOperatorChange(value as 'AND' | 'OR')
                                }
                                placeholder={t('selectOperator') || 'Select operator...'}
                                className="w-full"
                            />
                        </div>
                    )}

                    {/* Permission Input */}
                    <div className="space-y-2">
                        <IGRPLabelPrimitive>
                            {t('addPermission') || 'Add Permission'}
                        </IGRPLabelPrimitive>
                        <div className="flex gap-2">
                            {availablePermissions.length > 0 ? (
                                <IGRPCombobox
                                    options={availablePermissions.filter(
                                        (p) => !permissionItems.includes(p.value)
                                    )}
                                    value=""
                                    onChange={(value) => handlePermissionSelect(value as string)}
                                    placeholder={t('selectPermission') || 'Select a permission...'}
                                    className="flex-1"
                                />
                            ) : (
                                <IGRPInputPrimitive
                                    value={permissionInput}
                                    onChange={(e) => setPermissionInput(e.target.value)}
                                    placeholder={
                                        t('enterPermissionName') ||
                                        'Enter permission name (e.g., hr.employee.view)'
                                    }
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddPermission()
                                        }
                                    }}
                                />
                            )}
                            <IGRPButtonPrimitive
                                type="button"
                                onClick={handleAddPermission}
                                disabled={
                                    !permissionInput.trim() && availablePermissions.length === 0
                                }
                            >
                                {t('add') || 'Add'}
                            </IGRPButtonPrimitive>
                        </div>
                    </div>

                    {/* Permission Tags */}
                    {permissionItems.length > 0 && (
                        <div className="space-y-2">
                            <IGRPLabelPrimitive>
                                {t('selectedPermissions') || 'Selected Permissions'} (
                                {permissionItems.length})
                            </IGRPLabelPrimitive>
                            <div className="flex flex-wrap gap-2">
                                {permissionItems.map((perm) => (
                                    <div
                                        key={perm}
                                        className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-md text-sm"
                                    >
                                        <span>{perm}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePermission(perm)}
                                            className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Clear Permissions */}
                    {permissionItems.length > 0 && (
                        <IGRPButtonPrimitive
                            type="button"
                            variant="outline"
                            onClick={() => formik.setFieldValue('permission', undefined)}
                            className="w-full"
                        >
                            {t('clearPermissions') || 'Clear All Permissions'}
                        </IGRPButtonPrimitive>
                    )}
                </IGRPCardContentPrimitive>
            </IGRPCardPrimitive>

            {/* Roles Section */}
            <IGRPCardPrimitive>
                <IGRPCardHeaderPrimitive>
                    <IGRPCardTitlePrimitive>{t('roles') || 'Roles'}</IGRPCardTitlePrimitive>
                    <IGRPCardDescriptionPrimitive>
                        {t('configureRoles') ||
                            'Configure the roles required to access this action. Users must have at least one of these roles.'}
                    </IGRPCardDescriptionPrimitive>
                </IGRPCardHeaderPrimitive>
                <IGRPCardContentPrimitive className="space-y-4">
                    {/* Role Input */}
                    <div className="space-y-2">
                        <IGRPLabelPrimitive>{t('addRole') || 'Add Role'}</IGRPLabelPrimitive>
                        <div className="flex gap-2">
                            <IGRPInputPrimitive
                                value={roleInput}
                                onChange={(e) => setRoleInput(e.target.value)}
                                placeholder={
                                    t('enterRoleName') || 'Enter role name (e.g., ADMIN, USER)'
                                }
                                className="flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleAddRole()
                                    }
                                }}
                            />
                            <IGRPButtonPrimitive
                                type="button"
                                onClick={handleAddRole}
                                disabled={!roleInput.trim()}
                            >
                                {t('add') || 'Add'}
                            </IGRPButtonPrimitive>
                        </div>
                    </div>

                    {/* Role Tags */}
                    {roles.length > 0 && (
                        <div className="space-y-2">
                            <IGRPLabelPrimitive>
                                {t('selectedRoles') || 'Selected Roles'} ({roles.length})
                            </IGRPLabelPrimitive>
                            <div className="flex flex-wrap gap-2">
                                {roles.map((role) => (
                                    <div
                                        key={role}
                                        className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                                    >
                                        <span>{role}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRole(role)}
                                            className="ml-1 hover:bg-secondary/80 rounded-full p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Clear Roles */}
                    {roles.length > 0 && (
                        <IGRPButtonPrimitive
                            type="button"
                            variant="outline"
                            onClick={() => formik.setFieldValue('roles', [])}
                            className="w-full"
                        >
                            {t('clearRoles') || 'Clear All Roles'}
                        </IGRPButtonPrimitive>
                    )}
                </IGRPCardContentPrimitive>
            </IGRPCardPrimitive>
        </div>
    )
}
