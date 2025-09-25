import { Form, Formik } from 'formik';
import {
    IGRPButtonPrimitive,
    IGRPInputPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPInputText } from '@igrp/igrp-framework-react-design-system';
import { IGRPLabel } from '@igrp/igrp-framework-react-design-system';
import { useTranslation } from 'react-i18next';
import {
    IGRPTabsPrimitive,
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import * as Yup from 'yup';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { Connection } from 'src/main/types';
import useToast from '@renderer/hooks/useToast';

const databaseTypes = [
    { label: 'PostgreSQL', value: 'postgres' },
    { label: 'MySQL', value: 'mysql' },
    { label: 'MongoDB', value: 'mongodb' },
    { label: 'SQLite', value: 'sqlite' },
    { label: 'Oracle', value: 'oracle' },
    { label: 'Microsoft SQL Server', value: 'mssql' },
];

interface ConnectionFormProps {
    connection: Partial<Connection>;
    onSubmit: (values: Connection) => void;
    onCancel: () => void;
}

export function ConnectionForm({
    connection,
    onSubmit,
    onCancel,
}: ConnectionFormProps) {
    const { t } = useTranslation();
    const { showErrorToast, showSuccessToast } = useToast();

    const handleTestConnection = async (
        e: React.FormEvent<HTMLFormElement>,
        values: any
    ) => {
        e.preventDefault();
        const { success, message } =
            await window.igrpStudio.connection.connectToDatabase(values);
        if (success && message) {
            showSuccessToast(message);
        } else if (message) {
            showErrorToast(message);
        }
    };

    const validationSchema = Yup.object({
        name: Yup.string().required(t('ConnectionNameRequired')),
        databaseType: Yup.string().required(t('DatabaseTypeRequired')),
        host: Yup.string().required(t('HostRequired')),
        port: Yup.number()
            .required(t('PortRequired'))
            .min(1, t('PortGreaterThanZero')),
        user: Yup.string().required(t('UsernameRequired')),
        password: Yup.string().required(t('PasswordRequired')),
        // SSH validation
        sshHost: Yup.string().when('connectionType', {
            is: 'ssh',
            then: (schema) => schema.required(t('SSHHostRequired')),
            otherwise: (schema) => schema.optional(),
        }),
        sshPort: Yup.string().when('connectionType', {
            is: 'ssh',
            then: (schema) => schema.required(t('SSHPortRequired')),
            otherwise: (schema) => schema.optional(),
        }),
        sshUsername: Yup.string().when('connectionType', {
            is: 'ssh',
            then: (schema) => schema.required(t('SSHUsernameRequired')),
            otherwise: (schema) => schema.optional(),
        }),
        sshPassword: Yup.string().when('connectionType', {
            is: 'ssh',
            then: (schema) => schema.required(t('SSHPasswordRequired')),
            otherwise: (schema) => schema.optional(),
        }),
    });

    return (
        <Formik
            initialValues={{
                name: connection.name || '',
                databaseType: connection.databaseType || '',
                host: connection.host || '',
                port: connection.port || 5432,
                user: connection.user || '',
                password: connection.password || '',
                database: connection.database || '',
                connectionType: connection.connectionType || 'general',
                // SSH fields
                sshHost: connection.sshHost || '',
                sshPort: connection.sshPort || '22',
                sshUsername: connection.sshUsername || '',
                sshPassword: connection.sshPassword || '',
            }}
            validationSchema={validationSchema}
            onSubmit={(values, { setSubmitting }) => {
                onSubmit(values);
                setSubmitting(false);
            }}
        >
            {({
                handleChange,
                handleBlur,
                values,
                errors,
                touched,
                setFieldValue,
            }) => (
                <Form className="space-y-4">
                    <IGRPTabsPrimitive
                        defaultValue="general"
                        className="w-full"
                        onValueChange={(value) => {
                            setFieldValue('connectionType', value);
                        }}
                        value={values.connectionType}
                    >
                        <IGRPTabsListPrimitive className="grid w-full grid-cols-2">
                            <IGRPTabsTriggerPrimitive value="general">
                                {t('generalConnection')}
                            </IGRPTabsTriggerPrimitive>
                            <IGRPTabsTriggerPrimitive value="ssh">
                                {t('sshConnection')}
                            </IGRPTabsTriggerPrimitive>
                        </IGRPTabsListPrimitive>
                        <IGRPTabsContentPrimitive value="general">
                            <div className="space-y-4 grid md:grid-cols-1">
                                <div className="space-y-2">
                                    <IGRPLabel htmlFor="name">
                                        {t('connectionName')}
                                    </IGRPLabel>
                                    <IGRPInputText
                                        id="name"
                                        name="name"
                                        value={values.name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder={t('general')}
                                        required
                                    />
                                    {errors.name && touched.name && (
                                        <div className="text-xs text-destructive">
                                            {errors.name}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <IGRPLabel htmlFor="databaseType">
                                        {t('databaseType')}
                                    </IGRPLabel>
                                    <IGRPCombobox
                                        options={databaseTypes}
                                        value={values.databaseType}
                                        onChange={(
                                            selected: string | string[]
                                        ) => {
                                            setFieldValue(
                                                'databaseType',
                                                selected as string
                                            );
                                        }}
                                        className="w-full"
                                    />
                                    {errors.databaseType &&
                                        touched.databaseType && (
                                            <div className="text-xs text-destructive">
                                                {errors.databaseType}
                                            </div>
                                        )}
                                </div>

                                <div className="grid grid-cols-12 gap-2">
                                    <div className="col-span-9">
                                        <div className="space-y-2">
                                            <IGRPLabel htmlFor="host">
                                                {t('host')}
                                            </IGRPLabel>
                                            <IGRPInputText
                                                id="host"
                                                name="host"
                                                value={values.host}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder="IP / Host"
                                                required
                                            />
                                            {errors.host && touched.host && (
                                                <div className="text-xs text-destructive">
                                                    {errors.host}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-3">
                                        <div className="space-y-2">
                                            <IGRPLabel htmlFor="port">
                                                {t('port')}
                                            </IGRPLabel>
                                            <IGRPInputText
                                                id="port"
                                                name="port"
                                                type="number"
                                                value={values.port}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder="5432"
                                                required
                                            />
                                            {errors.port && touched.port && (
                                                <div className="text-xs text-destructive">
                                                    {errors.port}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <IGRPLabel htmlFor="user">
                                            {t('username')}
                                        </IGRPLabel>
                                        <IGRPInputText
                                            id="user"
                                            name="user"
                                            value={values.user}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder={t('username')}
                                        />
                                        {errors.user && touched.user && (
                                            <div className="text-xs text-destructive">
                                                {errors.user}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <IGRPLabel htmlFor="password">
                                            {t('password')}
                                        </IGRPLabel>
                                        <IGRPInputPrimitive
                                            id="password"
                                            name="password"
                                            type="password"
                                            value={values.password}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder={t('Password')}
                                        />
                                        {errors.password &&
                                            touched.password && (
                                                <div className="text-xs text-destructive">
                                                    {errors.password}
                                                </div>
                                            )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <IGRPLabel htmlFor="database">
                                        {t('databaseName')}
                                    </IGRPLabel>
                                    <IGRPInputPrimitive
                                        id="database"
                                        name="database"
                                        type="database"
                                        value={values.database}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="database"
                                    />
                                    {errors.password && touched.password && (
                                        <div className="text-xs text-destructive">
                                            {errors.password}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </IGRPTabsContentPrimitive>
                        <IGRPTabsContentPrimitive value="ssh">
                            <div className="space-y-4">
                                {/* Database Connection Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">
                                        {t('databaseConnection')}
                                    </h3>

                                    <div className="space-y-2">
                                        <IGRPLabel htmlFor="name">
                                            {t('connectionName')}
                                        </IGRPLabel>
                                        <IGRPInputText
                                            id="name"
                                            name="name"
                                            value={values.name}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder={t('connectionName')}
                                            required
                                        />
                                        {errors.name && touched.name && (
                                            <div className="text-xs text-destructive">
                                                {errors.name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col space-y-2">
                                        <IGRPLabel htmlFor="databaseType">
                                            {t('databaseType')}
                                        </IGRPLabel>
                                        <IGRPCombobox
                                            options={databaseTypes}
                                            value={values.databaseType}
                                            onChange={(
                                                selected: string | string[]
                                            ) => {
                                                setFieldValue(
                                                    'databaseType',
                                                    selected as string
                                                );
                                            }}
                                            className="w-full"
                                        />
                                        {errors.databaseType &&
                                            touched.databaseType && (
                                                <div className="text-xs text-destructive">
                                                    {errors.databaseType}
                                                </div>
                                            )}
                                    </div>

                                    <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-9">
                                            <div className="space-y-2">
                                                <IGRPLabel htmlFor="host">
                                                    {t('databaseHost')}
                                                </IGRPLabel>
                                                <IGRPInputText
                                                    id="host"
                                                    name="host"
                                                    value={values.host}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    placeholder="Database IP / Host"
                                                    required
                                                />
                                                {errors.host &&
                                                    touched.host && (
                                                        <div className="text-xs text-destructive">
                                                            {errors.host}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>

                                        <div className="col-span-3">
                                            <div className="space-y-2">
                                                <IGRPLabel htmlFor="port">
                                                    {t('databasePort')}
                                                </IGRPLabel>
                                                <IGRPInputText
                                                    id="port"
                                                    name="port"
                                                    type="number"
                                                    value={values.port}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    placeholder="5432"
                                                    required
                                                />
                                                {errors.port &&
                                                    touched.port && (
                                                        <div className="text-xs text-destructive">
                                                            {errors.port}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <IGRPLabel htmlFor="user">
                                                {t('databaseUsername')}
                                            </IGRPLabel>
                                            <IGRPInputText
                                                id="user"
                                                name="user"
                                                value={values.user}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder={t(
                                                    'databaseUsername'
                                                )}
                                            />
                                            {errors.user && touched.user && (
                                                <div className="text-xs text-destructive">
                                                    {errors.user}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <IGRPLabel htmlFor="password">
                                                {t('databasePassword')}
                                            </IGRPLabel>
                                            <IGRPInputPrimitive
                                                id="password"
                                                name="password"
                                                type="password"
                                                value={values.password}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder={t(
                                                    'databasePassword'
                                                )}
                                            />
                                            {errors.password &&
                                                touched.password && (
                                                    <div className="text-xs text-destructive">
                                                        {errors.password}
                                                    </div>
                                                )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <IGRPLabel htmlFor="database">
                                            {t('databaseName')}
                                        </IGRPLabel>
                                        <IGRPInputPrimitive
                                            id="database"
                                            name="database"
                                            value={values.database}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="database"
                                        />
                                    </div>
                                </div>

                                {/* SSH Connection Section */}
                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="text-lg font-medium">
                                        {t('sshConnection')}
                                    </h3>

                                    <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-9">
                                            <div className="space-y-2">
                                                <IGRPLabel htmlFor="sshHost">
                                                    {t('sshHost')}
                                                </IGRPLabel>
                                                <IGRPInputPrimitive
                                                    id="sshHost"
                                                    name="sshHost"
                                                    value={values.sshHost}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    placeholder="SSH Server IP / Host"
                                                    required
                                                />
                                                {errors.sshHost &&
                                                    touched.sshHost && (
                                                        <div className="text-xs text-destructive">
                                                            {errors.sshHost}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>

                                        <div className="col-span-3">
                                            <div className="space-y-2">
                                                <IGRPLabel htmlFor="sshPort">
                                                    {t('sshPort')}
                                                </IGRPLabel>
                                                <IGRPInputPrimitive
                                                    id="sshPort"
                                                    name="sshPort"
                                                    type="number"
                                                    value={values.sshPort}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    placeholder="22"
                                                    required
                                                />
                                                {errors.sshPort &&
                                                    touched.sshPort && (
                                                        <div className="text-xs text-destructive">
                                                            {errors.sshPort}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <IGRPLabel htmlFor="sshUsername">
                                                {t('sshUsername')}
                                            </IGRPLabel>
                                            <IGRPInputPrimitive
                                                id="sshUsername"
                                                name="sshUsername"
                                                value={values.sshUsername}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder={t('sshUsername')}
                                                required
                                            />
                                            {errors.sshUsername &&
                                                touched.sshUsername && (
                                                    <div className="text-xs text-destructive">
                                                        {errors.sshUsername}
                                                    </div>
                                                )}
                                        </div>

                                        <div className="space-y-2">
                                            <IGRPLabel htmlFor="sshPassword">
                                                {t('sshPassword')}
                                            </IGRPLabel>
                                            <IGRPInputPrimitive
                                                id="sshPassword"
                                                name="sshPassword"
                                                type="password"
                                                value={values.sshPassword}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder={t('sshPassword')}
                                                required
                                            />
                                            {errors.sshPassword &&
                                                touched.sshPassword && (
                                                    <div className="text-xs text-destructive">
                                                        {errors.sshPassword}
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </IGRPTabsContentPrimitive>
                    </IGRPTabsPrimitive>

                    <div className="flex justify-between items-center">
                        <IGRPButtonPrimitive
                            variant="link"
                            className="link text-igrp"
                            type="button"
                            onClick={(e: React.FormEvent<HTMLButtonElement>) =>
                                handleTestConnection(e as any, values)
                            }
                        >
                            {t('testConnection')}
                        </IGRPButtonPrimitive>
                        <div className="flex space-x-2 mt-4">
                            <IGRPButtonPrimitive
                                variant="outline"
                                onClick={onCancel}
                            >
                                {t('cancel')}
                            </IGRPButtonPrimitive>
                            <IGRPButtonPrimitive type="submit">
                                {connection.name ? t('Update') : t('Add')}{' '}
                                Connection
                            </IGRPButtonPrimitive>
                        </div>
                    </div>
                </Form>
            )}
        </Formik>
    );
}
