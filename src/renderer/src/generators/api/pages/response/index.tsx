import { Input } from '@renderer/components/ui/input';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import NavigationBar from '../../components/navigation-bar';
import { LabelRequired } from '@renderer/components/label-required';
import { SelectInput, TextInput } from '../../components/inputs-form';
import { JSONSchemaBuilder } from '../../components/JSONSchema';
import { useResponse } from './useResponse';
import { httpStatusCodes } from '@renderer/constants/appConstants';
import { useTranslation } from 'react-i18next';

interface ResponseProps {
    selectors: Array<any>;
    currentItem: any;
    onCloseTab: () => void;
}

export const ResponseLayout = ({
    currentItem,
    selectors,
    onCloseTab,
}: ResponseProps) => {
    const {
        formik,
        title,
        data,
        dataSchema,
        schemaTypes,
        handleDelete,
        handleChangeCode,
        handleSchemaChange,
        onClickSourceCode,
    } = useResponse({ currentItem, selectors });

    const { t } = useTranslation();

    return (
        <form onSubmit={formik.handleSubmit}>
            <NavigationBar
                onDelete={() => {
                    handleDelete();
                    onCloseTab();
                }}
                isNew={!data}
                title={title || t('createNewResponse')}
                showSourceCode={onClickSourceCode}
            />
            <div className="space-y-4 p-4">
                <Card className="rounded-sm p-6">
                    <div className="flex flex-col gap-4">
                        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
                            <SelectInput
                                id="statusCode"
                                label={t('httpStatusCode')}
                                options={httpStatusCodes}
                                value={formik.values.statusCode}
                                onChange={(value) => {
                                    formik.setFieldValue(t("statusCode"), value);
                                    handleChangeCode(value);
                                }}
                                onBlur={(value) => {
                                    formik.setFieldValue(t("statusCode"), value);
                                    handleChangeCode(value);
                                }}
                                error={formik.errors.statusCode}
                                isTouched={formik.touched.statusCode}
                                isRequired
                            />
                            <TextInput
                                type="text"
                                id="name"
                                label={t('name')}
                                value={formik.values.name}
                                error={formik.errors.name}
                                isTouched={formik.touched.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder={t('responseNamePlaceholder')}
                                isRequired
                            />
                            <div className="flex flex-col gap-3">
                                <LabelRequired>
                                    {t('contentType')}
                                </LabelRequired>
                                <Input
                                    name="contentType"
                                    value={'application/json'}
                                    readOnly
                                />
                            </div>
                        </div>
                        <TextInput
                            type="text"
                            id="description"
                            label={t('description')}
                            value={formik.values.description}
                            error={formik.errors.description}
                            isTouched={formik.touched.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder={t('description')}
                            className="w-full"
                        />
                        <Card className="rounded">
                            <CardHeader>
                                <CardTitle>{t('dataSchema')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <JSONSchemaBuilder
                                    schemaTypes={schemaTypes}
                                    initialSchema={dataSchema}
                                    onSchemaChange={handleSchemaChange}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </Card>
            </div>
        </form>
    );
};
