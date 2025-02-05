import * as React from 'react';
import {
    Monitor,
    Server,
    Upload,
    FolderOpen,
    ArrowLeft,
    ArrowRight,
    PlusCircle,
} from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@renderer/components/ui/dialog';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { FormikErrors, useFormik } from 'formik';
import {
    RadioGroup,
    RadioGroupItem,
} from '@renderer/components/ui/radio-group';

import { SpringConfig } from './components/configurations/spring-config';
import { NextConfig } from './components/configurations/next-config';
import { DotNetConfig } from './components/configurations/dotnet-config';
import { StepButton } from './components/step-button';
import { DialogDescription } from '@radix-ui/react-dialog';
import {
    projectIcons,
} from '@renderer/constants/appConstants';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import useToast from '@renderer/components/useToast';
import {
    setConfig,
    setBasePath,
    navigateToNextPage,
} from '@renderer/redux/thunks';
import {
    backendFrameworks,
    frontendFrameworks,
    STEPS,
    THEME_COLORS,
} from './data';
import { ProjectData } from 'src/main/types';
import { useTranslation } from 'react-i18next';
import { useProjectValidation } from './validation';

export function ProjectWizard() {
    const [open, setOpen] = React.useState(false);
    const [step, setStep] = React.useState(1);

    const navigate = useNavigate();
    const dispatch: any = useDispatch();
    const { showErrorToast } = useToast();
    const { t } = useTranslation(); // Hook for translations

    const initialValues: ProjectData = {
        name: '',
        type: undefined,
        framework: '',
        config: undefined,
        path: '',
        themeColor: '#000000',
    };

    const validationSchema = useProjectValidation({ t, step });

    const formik = useFormik({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: (values, actions) => {
            console.log('Form submitted with values:', values);
            actions.setSubmitting(false);
            createProject();
        },
    });

    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        // Focus the input when the component mounts
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const createProject = async (): Promise<void> => {
        try {
            const { error } = await window.engine.createProject(
                formik.values,
                formik.values.path
            );

            if (error) {
                showErrorToast(error);
                return;
            } else {
                handleClose();
            }

            const config: ProjectData = formik.values;

            dispatch(setBasePath(formik.values.path));
            dispatch(setConfig(config));
            navigateToNextPage(navigate, config);
        } catch (error) {
            showErrorToast(error);
        }
    };

    const componentsMap: Record<
        string,
        React.FC<{
            data: any;
            errors?: FormikErrors<ProjectData>;
            onChange: (config: any) => void;
        }>
    > = {
        springboot: SpringConfig,
        nextjs: NextConfig,
        dotnet: DotNetConfig,
    };

    const frameworks =
        formik.values.type === 'frontend'
            ? frontendFrameworks
            : backendFrameworks;

    const canNavigateToStep = (targetStep: number) => {
        if (targetStep === 1) return true;
        if (targetStep === 2)
            return !!formik.values.name && !!formik.values.type;
        if (targetStep === 3) return !!formik.values.framework;
        if (targetStep === 4) {
            return !!formik.values.config;
        }
        if (targetStep === STEPS.length) return !!formik.values.path.trim();
        return false;
    };

    const handleStepClick = (targetStep: number) => {
        if (canNavigateToStep(targetStep)) {
            setStep(targetStep);
        }
    };

    const handleNext = async () => {
        const errors = await formik.validateForm();

        if (
            step === 3 &&
            Object.keys(errors).length !== 0 &&
            errors.config !== undefined
        ) {
            return;
        }
        if (step < STEPS.length && canNavigateToStep(step + 1)) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setStep(1);
        formik.resetForm();
    };

    const handleOpenDirectory = () => {
        window.electron.ipcRenderer.send('open-directory-dialog');

        window.electron.ipcRenderer.on('file-content', (_e, result) => {
            if (!result.canceled) {
                formik.setFieldValue('path', result.filePaths[0]);
            }
        });
    };

    const handleChangeType = (value: string) => {
        if (formik.values.framework !== value)
            formik.setFieldValue('framework', '');
        formik.setFieldValue('type', value);
    };

    const handleChangeFramework = (value: string) => {
        if (formik.values.framework !== value)
            formik.setFieldValue('config', undefined);
        formik.setFieldValue('framework', value);
    };

    const SelectedComponent = formik.values?.framework
        ? componentsMap[formik.values?.framework]
        : null;

    React.useEffect(() => {
        if (open) return;
        formik.setValues(initialValues);
        setStep(1);
    }, [open]);

    React.useEffect(() => {
        formik.handleBlur('projectName');
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    {t('createNewProject')}
                </Button>
            </DialogTrigger>
            <DialogContent
                className="md:max-w-[700px] max-w-[800px]"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>{t('newProject')}</DialogTitle>
                    <DialogDescription />
                </DialogHeader>
                <form onSubmit={formik.handleSubmit}>
                    <div className="relative mb-6">
                        <div className="absolute top-5 left-0 right-0 h-[2px] bg-muted" />
                        <div className="relative flex justify-between">
                            {STEPS.map((s) => (
                                <StepButton
                                    key={s.id}
                                    step={s.id}
                                    currentStep={step}
                                    onClick={() => handleStepClick(s.id)}
                                    disabled={!canNavigateToStep(s.id)}
                                >
                                    {t(s.label)}
                                </StepButton>
                            ))}
                        </div>
                    </div>
                    <div className="py-2">
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        {t('projectName')}
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder={t('enterProjectName')}
                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        ref={inputRef}
                                        autoFocus
                                        maxLength={20}
                                    />
                                    {formik.touched.name &&
                                        formik.errors.name && (
                                            <p className="text-xs text-destructive">
                                                {formik.errors.name}
                                            </p>
                                        )}
                                </div>

                                <div className="space-y-2">
                                    <Label>{t('projectIcon')}</Label>
                                    <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-2">
                                        <Upload className="w-8 h-8 mx-auto text-gray-400" />
                                        <div className="text-sm text-gray-600">
                                            {t('clickOrDragToUploadIcon')}
                                            <div className="text-xs text-gray-400">
                                                {t('recommendedSize')}
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            {t('upload')}...
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>{t('projectType')}</Label>
                                    <RadioGroup
                                        name="type"
                                        value={formik.values.type}
                                        onValueChange={(value) =>
                                            handleChangeType(value)
                                        }
                                        className="grid grid-cols-2 gap-4"
                                    >
                                        <div
                                            className={`border rounded-lg p-4 cursor-pointer hover:border-primary/50 ${
                                                formik.values.type ===
                                                'frontend'
                                                    ? 'border-primary'
                                                    : ''
                                            }`}
                                        >
                                            <RadioGroupItem
                                                value="frontend"
                                                id="frontend"
                                                className="sr-only"
                                            />
                                            <Label
                                                htmlFor="frontend"
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <Monitor className="w-5 h-5" />
                                                <div>
                                                    <div>{t('frontend')}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {t(
                                                            'frontendDescription'
                                                        )}
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>
                                        <div
                                            className={`border rounded-lg p-4 cursor-pointer hover:border-primary/50 ${
                                                formik.values.type === 'backend'
                                                    ? 'border-primary'
                                                    : ''
                                            }`}
                                        >
                                            <RadioGroupItem
                                                value="backend"
                                                id="backend"
                                                className="sr-only"
                                            />
                                            <Label
                                                htmlFor="backend"
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <Server className="w-5 h-5" />
                                                <div>
                                                    <div>{t('backend')}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {t(
                                                            'backendDescription'
                                                        )}
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                    {formik.touched.type &&
                                        formik.errors.type && (
                                            <p className="text-xs text-destructive">
                                                {formik.errors.type}
                                            </p>
                                        )}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <Label>{t('selectFramework')}</Label>
                                <RadioGroup
                                    name="framework"
                                    value={formik.values.framework}
                                    onValueChange={(value) =>
                                        handleChangeFramework(value)
                                    }
                                    className="grid gap-4"
                                >
                                    {frameworks.map((fw) => (
                                        <div
                                            key={fw.id}
                                            className={`border rounded-lg p-4 cursor-pointer hover:border-primary/50 ${
                                                formik.values.framework ===
                                                fw.id
                                                    ? 'border-primary'
                                                    : ''
                                            } ${!fw.availableSupport ? 'pointer-events-none opacity-75' : ''}`}
                                        >
                                            <RadioGroupItem
                                                value={fw.id}
                                                id={fw.id}
                                                className="sr-only"
                                                disabled={!fw.availableSupport}
                                            />
                                            <Label
                                                htmlFor={fw.id}
                                                className="flex items-center gap-4 cursor-pointer"
                                            >
                                                <img
                                                    src={projectIcons[fw.id]}
                                                    alt={fw.name}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-lg"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium">
                                                            {fw.name}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {fw.description}
                                                    </div>
                                                    {!fw.availableSupport && (
                                                        <span className="ml-auto text-xs text-muted-foreground">
                                                            {t('comingSoon')}
                                                        </span>
                                                    )}
                                                </div>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                                {formik.touched.framework &&
                                    formik.errors.framework && (
                                        <p className="text-xs text-destructive">
                                            {formik.errors.framework}
                                        </p>
                                    )}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                {SelectedComponent ? (
                                    <>
                                        <Label>
                                            {t('frameworkConfiguration')}
                                        </Label>
                                        <SelectedComponent
                                            data={formik.values.config}
                                            errors={formik.errors}
                                            onChange={(config) =>
                                                formik.setFieldValue(
                                                    'config',
                                                    config
                                                )
                                            }
                                        />
                                    </>
                                ) : (
                                    <div className="text-center text-muted-foreground pb-8">
                                        {t('configurationComingSoon', {
                                            framework: formik.values.framework,
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6">
                                <div className="rounded-lg border p-4 space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="name">
                                                {t('projectName')}
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formik.values.name}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                            />
                                            {formik.touched.name &&
                                                formik.errors.name && (
                                                    <p className="text-xs text-destructive">
                                                        {formik.errors.name}
                                                    </p>
                                                )}
                                        </div>

                                        <div>
                                            <Label htmlFor="path">
                                                {t('projectDirectory')}
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="path"
                                                    name="path"
                                                    value={formik.values.path}
                                                    onChange={
                                                        formik.handleChange
                                                    }
                                                    onBlur={formik.handleBlur}
                                                    placeholder={t(
                                                        'enterProjectDirectory'
                                                    )}
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleOpenDirectory();
                                                    }}
                                                >
                                                    <FolderOpen className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {formik.touched.path &&
                                                formik.errors.path && (
                                                    <p className="text-xs text-destructive">
                                                        {formik.errors.path}
                                                    </p>
                                                )}
                                        </div>

                                        <div>
                                            <Label>{t('themeColor')}</Label>
                                            <div className="grid grid-cols-12 gap-2 mt-2">
                                                {THEME_COLORS.map((color) => (
                                                    <button
                                                        key={color.value}
                                                        type="button"
                                                        onClick={() =>
                                                            formik.setFieldValue(
                                                                'themeColor',
                                                                color.value
                                                            )
                                                        }
                                                        className={`
                              w-8 h-8 rounded-full 
                              ${formik.values.themeColor === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''}
                            `}
                                                        style={{
                                                            backgroundColor:
                                                                color.value,
                                                        }}
                                                        title={color.name}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <div className="flex w-full justify-between mt-4">
                            {step > 1 ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />{' '}
                                    {t('back')}
                                </Button>
                            ) : (
                                <div />
                            )}
                            {step < STEPS.length ? (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!canNavigateToStep(step + 1)}
                                >
                                    {t('next')}{' '}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={formik.isSubmitting}
                                >
                                    {t('createProject')}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
