import { Button } from '@renderer/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system'
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
            <Card>
                <CardHeader>
                    <CardTitle>{t('permissions') || 'Permissions'}</CardTitle>
                    <CardDescription>
                        {t('configurePermissions') ||
                            'Configure the permissions required to access this action. Use AND to require all permissions, OR to require at least one.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Permission Operator */}
                    {permissionItems.length > 0 && (
                        <div className="space-y-2">
                            <Label>{t('permissionOperator') || 'Permission Operator'}</Label>
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
                        <Label>{t('addPermission') || 'Add Permission'}</Label>
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
                                <Input
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
                            <Button
                                type="button"
                                onClick={handleAddPermission}
                                disabled={
                                    !permissionInput.trim() && availablePermissions.length === 0
                                }
                            >
                                {t('add') || 'Add'}
                            </Button>
                        </div>
                    </div>

                    {/* Permission Tags */}
                    {permissionItems.length > 0 && (
                        <div className="space-y-2">
                            <Label>
                                {t('selectedPermissions') || 'Selected Permissions'} (
                                {permissionItems.length})
                            </Label>
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
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => formik.setFieldValue('permission', undefined)}
                            className="w-full"
                        >
                            {t('clearPermissions') || 'Clear All Permissions'}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Roles Section */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('roles') || 'Roles'}</CardTitle>
                    <CardDescription>
                        {t('configureRoles') ||
                            'Configure the roles required to access this action. Users must have at least one of these roles.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Role Input */}
                    <div className="space-y-2">
                        <Label>{t('addRole') || 'Add Role'}</Label>
                        <div className="flex gap-2">
                            <Input
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
                            <Button
                                type="button"
                                onClick={handleAddRole}
                                disabled={!roleInput.trim()}
                            >
                                {t('add') || 'Add'}
                            </Button>
                        </div>
                    </div>

                    {/* Role Tags */}
                    {roles.length > 0 && (
                        <div className="space-y-2">
                            <Label>
                                {t('selectedRoles') || 'Selected Roles'} ({roles.length})
                            </Label>
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
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => formik.setFieldValue('roles', [])}
                            className="w-full"
                        >
                            {t('clearRoles') || 'Clear All Roles'}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
