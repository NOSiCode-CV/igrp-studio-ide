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
import { useFormik } from 'formik';
import * as Yup from 'yup';
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
    ENV_TYPES,
    PATTERNS,
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

export function ProjectWizard() {
    const [open, setOpen] = React.useState(false);
    const [step, setStep] = React.useState(1);

    const navigate = useNavigate();
    const dispatch: any = useDispatch();
    const { showErrorToast } = useToast();
    const { t } = useTranslation();

    const initialValues: ProjectData = {
        name: '',
        type: undefined,
        framework: '',
        config: undefined,
        path: '',
        themeColor: '#000000',
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string().required('Project name is required'),
        type: Yup.string().oneOf(
            ['frontend', 'backend'],
            'Project type is required'
        ),
        framework: Yup.string().required('Framework is required'),
        path: Yup.string().required('Project directory is required'),
        config: Yup.object().shape({
            appName: Yup.string().when('$framework', (framework, schema) => {
                return step === 3 &&
                    framework &&
                    framework[0] === ENV_TYPES.NEXTJS
                    ? schema
                          .required(t('thisFieldRequired', { name: 'Name' }))
                          .matches(
                              PATTERNS.NO_SPACE_AND_HYPHEN,
                              t('msgInfoAccpet')
                          )
                          .max(20, t('maxLengthExceeded', { max: 20 }))
                    : schema.notRequired();
            }),
            apiName: Yup.string().when('$framework', (framework, schema) => {
                return step === 3 &&
                    framework &&
                    [ENV_TYPES.SPRING, ENV_TYPES.DOTNET].includes(framework[0])
                    ? schema
                          .required(t('thisFieldRequired', { name: 'Name' }))
                          .matches(
                              PATTERNS.NO_SPACE_AND_HYPHEN,
                              t('msgInfoAccpet')
                          )
                          .max(20, t('maxLengthExceeded', { max: 20 }))
                    : schema.notRequired();
            }),
        }),
    });

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
        React.FC<{ data: any; onChange: (config: any) => void }>
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

    const handleNext = () => {
        if (step < STEPS.length && canNavigateToStep(step + 1)) {
            setStep(step + 1);
        }

        formik.validateForm();
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

    const SelectedComponent = formik.values?.framework
        ? componentsMap[formik.values?.framework]
        : null;

    React.useEffect(() => {
        if (open) return;
        formik.setValues(initialValues);
        setStep(1)
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={setOpen} >
            <DialogTrigger asChild>
                <Button variant="outline">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create New Project
                </Button>
            </DialogTrigger>
            <DialogContent className="md:max-w-[700px] max-w-[800px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>New Project</DialogTitle>
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
                                    {s.label}
                                </StepButton>
                            ))}
                        </div>
                    </div>
                    <div className="py-2">
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Project Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Enter project name"
                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                    {formik.touched.name &&
                                        formik.errors.name && (
                                            <p className="text-sm text-destructive">
                                                {formik.errors.name}
                                            </p>
                                        )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Project Icon</Label>
                                    <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-2">
                                        <Upload className="w-8 h-8 mx-auto text-gray-400" />
                                        <div className="text-sm text-gray-600">
                                            Click or drag to upload icon
                                            <div className="text-xs text-gray-400">
                                                Recommended size: 512x512px
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            Upload...
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Project Type</Label>
                                    <RadioGroup
                                        name="type"
                                        value={formik.values.type}
                                        onValueChange={(value) =>
                                            formik.setFieldValue('type', value)
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
                                                    <div>Frontend</div>
                                                    <div className="text-sm text-gray-500">
                                                        Create a standalone
                                                        frontend application
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
                                                    <div>Backend</div>
                                                    <div className="text-sm text-gray-500">
                                                        Create a API or Backend
                                                        Service
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                    {formik.touched.type &&
                                        formik.errors.type && (
                                            <p className="text-sm text-destructive">
                                                {formik.errors.type}
                                            </p>
                                        )}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <Label>Select Framework</Label>
                                <RadioGroup
                                    name="framework"
                                    value={formik.values.framework}
                                    onValueChange={(value) =>
                                        formik.setFieldValue('framework', value)
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
                                            }`}
                                        >
                                            <RadioGroupItem
                                                value={fw.id}
                                                id={fw.id}
                                                className="sr-only"
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
                                                </div>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                                {formik.touched.framework &&
                                    formik.errors.framework && (
                                        <p className="text-sm text-destructive">
                                            {formik.errors.framework}
                                        </p>
                                    )}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                {SelectedComponent ? (
                                    <>
                                        <Label>Framework Configuration</Label>
                                        <SelectedComponent
                                            data={formik.values.config}
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
                                        Configuration options for{' '}
                                        {formik.values.framework} will be
                                        available soon
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
                                                Project Name
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
                                                    <p className="text-sm text-destructive">
                                                        {formik.errors.name}
                                                    </p>
                                                )}
                                        </div>

                                        <div>
                                            <Label htmlFor="path">
                                                Project Directory
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
                                                    placeholder="/path/to/project"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={
                                                        handleOpenDirectory
                                                    }
                                                >
                                                    <FolderOpen className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {formik.touched.path &&
                                                formik.errors.path && (
                                                    <p className="text-sm text-destructive">
                                                        {formik.errors.path}
                                                    </p>
                                                )}
                                        </div>

                                        <div>
                                            <Label>Theme Color</Label>
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
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
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
                                    Next <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={formik.isSubmitting}
                                >
                                    Create Project
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
