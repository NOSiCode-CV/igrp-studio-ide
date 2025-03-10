import { Form, Formik } from 'formik';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import * as Yup from 'yup';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { Connection } from 'src/main/types';
import useToast from '@renderer/components/useToast';

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

const validationSchema = Yup.object({
    name: Yup.string().required('Connection name is required'),
    databaseType: Yup.string().required('Database type is required'),
    host: Yup.string().required('Host is required'),
    port: Yup.number()
        .required('Port is required')
        .min(1, 'Port must be greater than 0'),
    user: Yup.string().required('Username is required'),
    password: Yup.string().required('Password is required'),
});

export function ConnectionForm({
    connection,
    onSubmit,
    onCancel,
}: ConnectionFormProps) {
    const { showErrorToast, showSuccessToast } = useToast();

    const handleTestConnection = async (e, values) => {
        e.preventDefault();
        const { success, message } = await window.api.connectToDatabase(
            values
        );
        if (success) {
            showSuccessToast(message);
        } else showErrorToast(message);
    };

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
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="general">
                                General Connection
                            </TabsTrigger>
                            <TabsTrigger value="ssh">
                                SSH Connection
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                            <div className="space-y-4 grid md:grid-cols-1">
                                <div>
                                    <Label htmlFor="name">
                                        Connection Name
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={values.name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="My Database Connection"
                                        required
                                    />
                                    {errors.name && touched.name && (
                                        <div className='text-xs'>{errors.name}</div>
                                    )}
                                </div>

                                <div className="flex flex-col space-y-1">
                                    <Label htmlFor="databaseType">
                                        Database Type
                                    </Label>
                                    <IGRPCombobox
                                        options={databaseTypes}
                                        value={values.databaseType}
                                        onChange={(value) => {
                                            setFieldValue(
                                                'databaseType',
                                                value
                                            );
                                        }}
                                        name="databaseType"
                                        className="w-full"
                                    />
                                    {errors.databaseType &&
                                        touched.databaseType && (
                                            <div className='text-xs'>{errors.databaseType}</div>
                                        )}
                                </div>

                                <div className="grid grid-cols-12 gap-2">
                                    <div className="col-span-9">
                                        <div>
                                            <Label htmlFor="host">Host</Label>
                                            <Input
                                                id="host"
                                                name="host"
                                                value={values.host}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder="IP / Host"
                                                required
                                            />
                                            {errors.host && touched.host && (
                                                <div className="text-xs">
                                                    {errors.host}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-3">
                                        <div>
                                            <Label htmlFor="port">Port</Label>
                                            <Input
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
                                                <div className="text-xs">
                                                    {errors.port}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label htmlFor="user">Username</Label>
                                        <Input
                                            id="user"
                                            name="user"
                                            value={values.user}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="Username"
                                        />
                                        {errors.user && touched.user && (
                                            <div className="text-xs">
                                                {errors.user}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="password">
                                            Password
                                        </Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            value={values.password}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="Password"
                                        />
                                        {errors.password &&
                                            touched.password && (
                                                <div className="text-xs">
                                                    {errors.password}
                                                </div>
                                            )}
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="database">
                                        Database Name
                                    </Label>
                                    <Input
                                        id="database"
                                        name="database"
                                        type="database"
                                        value={values.database}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="database"
                                    />
                                    {errors.password && touched.password && (
                                        <div className="text-xs">
                                            {errors.password}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="ssh">
                            {/* SSH form fields */}
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-between items-center">
                        <Button
                            variant="link"
                            className="link text-igrp"
                            type="button"
                            onClick={(e) => handleTestConnection(e, values)}
                        >
                            Test connection
                        </Button>
                        <div className="flex space-x-2 mt-4">
                            <Button variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {connection.name ? 'Update' : 'Add'} Connection
                            </Button>
                        </div>
                    </div>
                </Form>
            )}
        </Formik>
    );
}
