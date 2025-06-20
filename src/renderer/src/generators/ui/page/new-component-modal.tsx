import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import useToast from '@renderer/hooks/useToast';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import { ENV_TYPES, PATTERNS } from '@renderer/constants/appConstants';
import { useGit } from '@renderer/hooks/use-git';
import {
    Arguments,
    ComponentConfig,
} from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { getId } from '@renderer/utils';
import IconBrowser from '@renderer/components/icon/icon-browser';
import { useEffect, useState } from 'react';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { TextInput } from '@renderer/generators/api/components/inputs-form';
import { camelCase } from 'lodash-es';
import { FocusEvent } from 'react';
import { Separator } from '@renderer/components/ui/separator';
import {
    FunctionArguments,
    returnTypeOptions,
} from '../components/sidebar/custom-code/functions-settings';
import { PageDefinition } from './list-pages';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';

const initialValues: ComponentConfig = {
    type: 'component',
    scope: 'app',
    pagePath: undefined,
    pageName: undefined,
    description: '',
    icon: undefined,
    name: '',
    id: '',
    args: [],
};

interface NewComponentModalProps {
    isOpen: boolean;
    basePath: string;
    pageOptions: any[];
    currentComponent?: PageDefinition;
    onClose: () => void;
    onConfirm: () => void;
}

export function NewComponentModal({
    isOpen,
    basePath,
    onClose,
    onConfirm,
    pageOptions,
    currentComponent,
}: NewComponentModalProps) {
    const { t } = useTranslation();

    const { createGitCommit } = useGit();

    const { showErrorToast, showSuccessToast } = useToast();

    const [arguments_, setArguments] = useState<Arguments[]>([]);

    useEffect(() => {
        formik.resetForm();
    }, [isOpen]);

    const handleConfirm = async (
        pageConfig: ComponentConfig
    ): Promise<void> => {
        try {
            const { error } = await window.engine.createPage(
                { ...pageConfig, id: getId() },
                ENV_TYPES.NEXTJS,
                basePath
            );

            console.log(pageConfig);

            if (error) {
                showErrorToast(error);
                return;
            }

            showSuccessToast(
                `Component ${pageConfig.name} has been successfully added.`
            );
            // commit after creating the page
            createGitCommit(
                basePath,
                t('addComponent', { name: pageConfig.name })
            );
            onConfirm?.();

            formik.resetForm();
        } catch (error) {
            console.log(error);
            showErrorToast(error);
        }
    };

    const validationSchema = Yup.object({
        description: Yup.string().required(
            t('thisFieldRequired', { name: t('componentTitle') })
        ),
        name: Yup.string()
            .required(t('thisFieldRequired', { name: t('name') }))
            .matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet')),
    });

    const formik = useFormik<ComponentConfig>({
        enableReinitialize: true,
        initialValues: { ...initialValues, ...currentComponent?.content },
        validationSchema,
        onSubmit: (values, actions) => {
            actions.setSubmitting(false);
            console.log(values);
            handleConfirm(values);
        },
    });

    const handleDescriptionBlur = async (
        e: FocusEvent<HTMLInputElement>
    ): Promise<void> => {
        formik.handleBlur(e);

        if (formik.values.name) return;
        const generatedPath = `${camelCase(e.target.value)}`;
        formik.setFieldValue('name', generatedPath);
    };

    useEffect(() => {
        formik.setFieldValue('args', arguments_);
    }, [arguments_]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full sm:max-w-[800px] lg:max-w-[60vw] max-w-[70vw]">
                <DialogTitle>{t('createNewComponent')}</DialogTitle>
                <DialogDescription>
                    {t('comonDialogtDescription', { name: 'Component' })}
                </DialogDescription>
                <form
                    className="needs-validation"
                    onSubmit={(e) => {
                        e.preventDefault();
                        formik.handleSubmit();
                    }}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-3">
                            <TextInput
                                id="description"
                                label={t('componentTitle')}
                                onChange={formik.handleChange}
                                onBlur={handleDescriptionBlur}
                                value={formik.values.description || ''}
                                isTouched={formik.touched.description}
                                error={formik.errors.description}
                                placeholder="Todo Item"
                                isRequired
                            />
                            <TextInput
                                id="name"
                                label={t('componentName')}
                                className="col-span-3"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.name || ''}
                                placeholder="TodoItem"
                            />
                            <div className="grid grid-cols-1 items-center gap-3">
                                <Label htmlFor="Associar">{t('pages')}</Label>
                                <IGRPCombobox
                                    name="pagePath"
                                    className="col-span-3"
                                    value={formik.values.pagePath || ''}
                                    options={pageOptions}
                                    placeholder="Select page"
                                    helperText={t('componentAssociation')}
                                    onChange={(selectedValue) => {
                                        const selected = pageOptions.find(
                                            (opt) => opt.value === selectedValue
                                        );
                                        formik.setFieldValue(
                                            'pagePath',
                                            selected?.path || undefined
                                        );
                                        formik.setFieldValue(
                                            'pageName',
                                            selected?.value || undefined
                                        );
                                        formik.setFieldValue(
                                            'scope',
                                            selectedValue ? 'page' : 'app'
                                        );
                                    }}
                                />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <IconBrowser
                                    onSelectedIcon={(icon) => {
                                        formik.setFieldValue('icon', icon);
                                    }}
                                    selectedIcon={formik.values.icon || ''}
                                />
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Generated Component Signature
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                                        <code>
                                            {`export default function  myComponent(`}
                                            {(formik.values.args || [])
                                                .map((arg, index) => {
                                                    let paramStr =
                                                        arg.name ||
                                                        `param${index + 1}`;

                                                    if (arg.isOptional)
                                                        paramStr += '?';

                                                    paramStr += ': ';

                                                    /*  if (arg.isState) {
                                                        // Handle state setter
                                                        paramStr += `(${arg.stateParameterType}: ${arg.stateParameterName}) => void`;
                                                    } else  */
                                                    if (arg.isFunction) {
                                                        // Handle regular function
                                                        const params =
                                                            arg?.functionParameters &&
                                                            arg.functionParameters
                                                                .map(
                                                                    (p) =>
                                                                        `${p.name}${p.isOptional ? '?' : ''}: ${p.type}`
                                                                )
                                                                .join(', ');
                                                        paramStr += `(${params}) => ${arg.type}`;
                                                    } else {
                                                        // Handle regular parameter
                                                        paramStr += arg.type;
                                                    }

                                                    if (arg.isList)
                                                        paramStr += '[]';

                                                    return paramStr;
                                                })
                                                .join(', ')}
                                            {`) {
  // Component implementation
}`}
                                        </code>
                                    </pre>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="col-span-1 py-4">
                            <div className="flex flex-row space-x-3 w-full h-full">
                                <Separator orientation="vertical" />
                                <div className="w-full flex-1">
                                    <FunctionArguments
                                        value={formik.values?.args || []}
                                        onChange={setArguments}
                                        returnTypeOptions={returnTypeOptions}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex justify-between">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            {t('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={formik.isSubmitting}
                            color="primary"
                        >
                            {formik.isSubmitting ? t('saving') : t('save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
