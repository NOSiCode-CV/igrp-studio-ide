import { ENV_TYPES, OPTION_TYPE } from '@renderer/constants/appConstants';
import { useFormik } from 'formik';
import { changeValue } from '../../helpers';
import { useEffect, useState } from 'react';
import NavigationBar from '../../components/navigation-bar';
import { useDispatch } from 'react-redux';
import useToast from '@renderer/hooks/useToast';
import { useTranslation } from 'react-i18next';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useTabs } from '@renderer/components/navigation/TabContext';
import { usePermisisonValidation } from './validation';
import { FormList } from '../../../../components/form-list';
import { getTablesColumns, defaultInitialValues } from './config';
import { PermissionConfig } from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types';
import useStudioAPI from '@renderer/hooks/use-studio-api';

interface PermissionsProps {
    selectors: Array<any>;
    currentItem: any;
    onCloseTab: () => void;
}

export const PermissionsLayout = ({
    currentItem,
}: PermissionsProps) => {
    const dispatch: any = useDispatch();
    const { showErrorToast, showSuccessToast } = useToast();
    const { t } = useTranslation();
    const { initializeTabFromCurrentItem } = useTabs();

    const { basePath, permissions } = useStudioAPI(currentItem?.module);

    const [title, _setTitle] = useState('');

    const [data, _setData] = useState<any>(null);

    const [fetchedPermissions, setFetchedPermissions] = useState<
        PermissionConfig[] | null
    >(null);

    const [tablesColumns, setTableColumns] = useState<{
        [value: string]: any[];
    }>({});

    const validationSchema = usePermisisonValidation({ t });

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            permissions: fetchedPermissions ?? defaultInitialValues,
        },
        validationSchema,
        onSubmit: (values, actions) => {
            actions.setSubmitting(false);
            handleSave(values.permissions); // Pass values to the save handler
        },
    });

    useEffect(() => {
        const res = getTablesColumns();
        setTableColumns(res);
    }, []);

    useEffect(() => {
        const getJsonData = async () => {
            try {
                const allPermissions = await Promise.all(
                    permissions.map(async (permission) => {
                        try {
                            const data = await window.api.getJsonContent(
                                permission.path
                            );
                            return data;
                        } catch (error) {
                            console.error(
                               t("errorLoadJsonPermission", { permissionName: "ReadAccess" }),
                                error
                            );
                            return null;
                        }
                    })
                );

                const filteredPermissions = allPermissions.filter(
                    (item) => item !== null
                );
                setFetchedPermissions(
                    filteredPermissions as PermissionConfig[]
                );
                formik.setFieldValue(
                    t('permissions'),
                    filteredPermissions as PermissionConfig[]
                );
            } catch (error) {
                console.error(t("failedLoadJsonContent"), error);
            }
        };

        getJsonData();
    }, [permissions]);

    const handleSave = async (permissions: PermissionConfig[]) => {
        try {
            for (const permission of permissions) {
                if (permission.endpoints.length === 0) {
                    const { error } = await window.engine.createPermission(
                        permission,
                        ENV_TYPES.SPRING,
                        basePath
                    );
                    if (error) {
                        showErrorToast(error);
                        return;
                    }
                }
            }
            dispatch(onSetChangeStatus(true));
            showSuccessToast(
                t('createdSuccess', {
                    name: t('permissions'),
                })
            );
        } catch (error) {
            showErrorToast(error as string);
        }
    };

    const handleDelete = async (
        _permission: PermissionConfig,
        index: number
    ) => {
        try {
            const config = {
                name: 'Permisison',
                type: 'permission',
                module: currentItem.module,
            };

            const { error } = await window.engine.delete(
                config,
                ENV_TYPES.SPRING,
                basePath
            );
            if (error) {
                showErrorToast(error);
                return;
            }

            formik.setFieldValue(
                 t("permissions"),
                formik.values.permissions.filter((_, i) => i !== index)
            );

            dispatch(onSetChangeStatus(true));
            showSuccessToast(t('deletedSuccess', { name: t('permisisons') }));
        } catch (error) {
            showErrorToast(error as string);
        }
    };

    const addNewPermission = () => {
        formik.setFieldValue(t("permissions"), [
            ...formik.values.permissions,
            { type: t("permission"), name: '', description: '', endpoints: [] },
        ]);
    };

    const onClickSourceCode = () => {
        initializeTabFromCurrentItem({
            path: `${currentItem.path}`,
            type: OPTION_TYPE.FILE_THREE,
            label: `${currentItem.label}.json`,
        });
    };

    const tabName = t("permissions");

    console.log(tablesColumns[tabName]);

    return (
        <form onSubmit={formik.handleSubmit}>
            <NavigationBar
                onDelete={() => console.log('')}
                isNew={!data}
                title={title || t('createNewPermission')}
                showSourceCode={onClickSourceCode}
            />
            <div className="space-y-4 p-4">
                {tablesColumns[tabName] && (
                    <FormList
                        formik={formik}
                        columns={tablesColumns[tabName]}
                        data={formik.values.permissions}
                        errors={formik.errors[tabName]}
                        addRow={addNewPermission}
                        removeRow={(index) =>
                            handleDelete(
                                formik.values.permissions[index],
                                index
                            )
                        }
                        changeValue={(element, position, val) =>
                            changeValue(formik, element, position, val, tabName)
                        }
                        name={tabName}
                        btnLabels="Permission"
                    />
                )}
            </div>
        </form>
    );
};
