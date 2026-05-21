import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system'
import useToast from '@renderer/hooks/useToast'
import { errorMessage, useZodForm } from '@renderer/lib/form'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Connection } from 'src/main/types'
import { z } from 'zod'

const databaseTypes = [
    { label: 'PostgreSQL', value: 'postgres' },
    { label: 'MySQL', value: 'mysql' },
    { label: 'MongoDB', value: 'mongodb' },
    { label: 'SQLite', value: 'sqlite' },
    { label: 'Oracle', value: 'oracle' },
    { label: 'Microsoft SQL Server', value: 'mssql' }
]

interface ConnectionFormValues {
    name: string
    databaseType: string
    host: string
    port: number
    user: string
    password: string
    database: string
    connectionType: string
    sshHost: string
    sshPort: string
    sshUsername: string
    sshPassword: string
}

interface ConnectionFormProps {
    connection: Partial<Connection>
    onSubmit: (values: Connection) => void
    onCancel: () => void
}

export function ConnectionForm({
    connection,
    onSubmit,
    onCancel
}: ConnectionFormProps): React.ReactNode {
    const { t } = useTranslation()
    const { showErrorToast, showSuccessToast } = useToast()

    // Build the schema with a discriminator on `connectionType` so the SSH
    // fields become required only when the SSH tab is selected — matching
    // the original `Yup.string().when('connectionType', ...)` logic.
    const schema = useMemo(() => {
        const sshConditional = (msg: string) =>
            z
                .string()
                .optional()
                .superRefine((value, ctx) => {
                    const parent = (ctx as unknown as { parent?: { connectionType?: string } })
                        .parent
                    if (parent?.connectionType === 'ssh' && (!value || value.length === 0)) {
                        ctx.addIssue({ code: 'custom', message: msg })
                    }
                })

        return z
            .object({
                name: z.string().min(1, t('ConnectionNameRequired')),
                databaseType: z.string().min(1, t('DatabaseTypeRequired')),
                host: z.string().min(1, t('HostRequired')),
                // Use `z.coerce.number()` so the form's string-typed input
                // value still validates against a numeric schema.
                port: z.coerce.number().min(1, t('PortGreaterThanZero')),
                user: z.string().min(1, t('UsernameRequired')),
                password: z.string().min(1, t('PasswordRequired')),
                database: z.string().default(''),
                connectionType: z.string().default('general'),
                sshHost: sshConditional(t('SSHHostRequired')),
                sshPort: sshConditional(t('SSHPortRequired')),
                sshUsername: sshConditional(t('SSHUsernameRequired')),
                sshPassword: sshConditional(t('SSHPasswordRequired'))
            })
            .passthrough() as unknown as z.ZodType<ConnectionFormValues, unknown>
    }, [t])

    const defaultValues = useMemo<ConnectionFormValues>(
        () => ({
            name: connection.name || '',
            databaseType: connection.databaseType || '',
            host: connection.host || '',
            port: connection.port || 5432,
            user: connection.user || '',
            password: connection.password || '',
            database: connection.database || '',
            connectionType: connection.connectionType || 'general',
            sshHost: connection.sshHost || '',
            sshPort: connection.sshPort || '22',
            sshUsername: connection.sshUsername || '',
            sshPassword: connection.sshPassword || ''
        }),
        [connection]
    )

    const form = useZodForm<ConnectionFormValues>({ schema, defaultValues })
    const { register, watch, setValue, handleSubmit, formState } = form
    const { errors, touchedFields } = formState

    const values = watch()

    const handleTestConnection = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault()
        const { success, message } = await window.igrpStudio.connection.connectToDatabase(
            values as unknown as Connection
        )
        if (success && message) {
            showSuccessToast(message)
        } else if (message) {
            showErrorToast(message)
        }
    }

    const onFormSubmit = handleSubmit((submitted) => {
        // `connectionType` is a free string in the form for tab handling but
        // narrows to the union expected by the persisted Connection shape.
        onSubmit(submitted as unknown as Connection)
    })

    // Shorthand for the recurring "(touched && error) ? message" pattern.
    const fieldError = (name: keyof ConnectionFormValues): string | undefined =>
        touchedFields[name as keyof typeof touchedFields]
            ? errorMessage(errors[name as keyof typeof errors] as never)
            : undefined

    return (
        <form className="space-y-4" onSubmit={onFormSubmit}>
            <Tabs
                defaultValue="general"
                className="w-full"
                value={values.connectionType}
                onValueChange={(value) =>
                    setValue('connectionType', value, { shouldValidate: true })
                }
            >
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="general">{t('generalConnection')}</TabsTrigger>
                    <TabsTrigger value="ssh">{t('sshConnection')}</TabsTrigger>
                </TabsList>
                <TabsContent value="general">
                    <div className="space-y-4 grid md:grid-cols-1">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('connectionName')}</Label>
                            <Input
                                id="name"
                                {...register('name')}
                                placeholder={t('general')}
                                required
                            />
                            {fieldError('name') && (
                                <div className="text-xs text-destructive">{fieldError('name')}</div>
                            )}
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="databaseType">{t('databaseType')}</Label>
                            <IGRPCombobox
                                options={databaseTypes}
                                value={values.databaseType}
                                onChange={(selected: string | string[]) => {
                                    setValue('databaseType', selected as string, {
                                        shouldValidate: true,
                                        shouldTouch: true
                                    })
                                }}
                                className="w-full"
                            />
                            {fieldError('databaseType') && (
                                <div className="text-xs text-destructive">
                                    {fieldError('databaseType')}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-9">
                                <div className="space-y-2">
                                    <Label htmlFor="host">{t('host')}</Label>
                                    <Input
                                        id="host"
                                        {...register('host')}
                                        placeholder="IP / Host"
                                        required
                                    />
                                    {fieldError('host') && (
                                        <div className="text-xs text-destructive">
                                            {fieldError('host')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-span-3">
                                <div className="space-y-2">
                                    <Label htmlFor="port">{t('port')}</Label>
                                    <Input
                                        id="port"
                                        type="number"
                                        {...register('port', { valueAsNumber: true })}
                                        placeholder="5432"
                                        required
                                    />
                                    {fieldError('port') && (
                                        <div className="text-xs text-destructive">
                                            {fieldError('port')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label htmlFor="user">{t('username')}</Label>
                                <Input
                                    id="user"
                                    {...register('user')}
                                    placeholder={t('username')}
                                />
                                {fieldError('user') && (
                                    <div className="text-xs text-destructive">
                                        {fieldError('user')}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">{t('password')}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register('password')}
                                    placeholder={t('Password')}
                                />
                                {fieldError('password') && (
                                    <div className="text-xs text-destructive">
                                        {fieldError('password')}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="database">{t('databaseName')}</Label>
                            <Input id="database" {...register('database')} placeholder="database" />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="ssh">
                    <div className="space-y-4">
                        {/* Database Connection Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">{t('databaseConnection')}</h3>

                            <div className="space-y-2">
                                <Label htmlFor="name">{t('connectionName')}</Label>
                                <Input
                                    id="name"
                                    {...register('name')}
                                    placeholder={t('connectionName')}
                                    required
                                />
                                {fieldError('name') && (
                                    <div className="text-xs text-destructive">
                                        {fieldError('name')}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="databaseType">{t('databaseType')}</Label>
                                <IGRPCombobox
                                    options={databaseTypes}
                                    value={values.databaseType}
                                    onChange={(selected: string | string[]) => {
                                        setValue('databaseType', selected as string, {
                                            shouldValidate: true,
                                            shouldTouch: true
                                        })
                                    }}
                                    className="w-full"
                                />
                                {fieldError('databaseType') && (
                                    <div className="text-xs text-destructive">
                                        {fieldError('databaseType')}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-12 gap-2">
                                <div className="col-span-9">
                                    <div className="space-y-2">
                                        <Label htmlFor="host">{t('databaseHost')}</Label>
                                        <Input
                                            id="host"
                                            {...register('host')}
                                            placeholder="Database IP / Host"
                                            required
                                        />
                                        {fieldError('host') && (
                                            <div className="text-xs text-destructive">
                                                {fieldError('host')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="col-span-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="port">{t('databasePort')}</Label>
                                        <Input
                                            id="port"
                                            type="number"
                                            {...register('port', { valueAsNumber: true })}
                                            placeholder="5432"
                                            required
                                        />
                                        {fieldError('port') && (
                                            <div className="text-xs text-destructive">
                                                {fieldError('port')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="user">{t('databaseUsername')}</Label>
                                    <Input
                                        id="user"
                                        {...register('user')}
                                        placeholder={t('databaseUsername')}
                                    />
                                    {fieldError('user') && (
                                        <div className="text-xs text-destructive">
                                            {fieldError('user')}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">{t('databasePassword')}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        {...register('password')}
                                        placeholder={t('databasePassword')}
                                    />
                                    {fieldError('password') && (
                                        <div className="text-xs text-destructive">
                                            {fieldError('password')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="database">{t('databaseName')}</Label>
                                <Input
                                    id="database"
                                    {...register('database')}
                                    placeholder="database"
                                />
                            </div>
                        </div>

                        {/* SSH Connection Section */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-medium">{t('sshConnection')}</h3>

                            <div className="grid grid-cols-12 gap-2">
                                <div className="col-span-9">
                                    <div className="space-y-2">
                                        <Label htmlFor="sshHost">{t('sshHost')}</Label>
                                        <Input
                                            id="sshHost"
                                            {...register('sshHost')}
                                            placeholder="SSH Server IP / Host"
                                            required
                                        />
                                        {fieldError('sshHost') && (
                                            <div className="text-xs text-destructive">
                                                {fieldError('sshHost')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="col-span-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="sshPort">{t('sshPort')}</Label>
                                        <Input
                                            id="sshPort"
                                            type="number"
                                            {...register('sshPort')}
                                            placeholder="22"
                                            required
                                        />
                                        {fieldError('sshPort') && (
                                            <div className="text-xs text-destructive">
                                                {fieldError('sshPort')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="sshUsername">{t('sshUsername')}</Label>
                                    <Input
                                        id="sshUsername"
                                        {...register('sshUsername')}
                                        placeholder={t('sshUsername')}
                                        required
                                    />
                                    {fieldError('sshUsername') && (
                                        <div className="text-xs text-destructive">
                                            {fieldError('sshUsername')}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sshPassword">{t('sshPassword')}</Label>
                                    <Input
                                        id="sshPassword"
                                        type="password"
                                        {...register('sshPassword')}
                                        placeholder={t('sshPassword')}
                                        required
                                    />
                                    {fieldError('sshPassword') && (
                                        <div className="text-xs text-destructive">
                                            {fieldError('sshPassword')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex justify-between items-center">
                <Button
                    variant="link"
                    className="link text-igrp"
                    type="button"
                    onClick={handleTestConnection}
                >
                    {t('testConnection')}
                </Button>
                <div className="flex space-x-2 mt-4">
                    <Button variant="outline" onClick={onCancel}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit">
                        {connection.name ? t('Update') : t('Add')} Connection
                    </Button>
                </div>
            </div>
        </form>
    )
}
