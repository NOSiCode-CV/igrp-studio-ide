import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@renderer/components/ui/sidebar';
import {
    ChevronDown,
    ChevronRight,
    FunctionSquare,
    Loader2,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { EmptyList } from '@renderer/components/empty-list';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { Button } from '@renderer/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import MonacoEditor from '@renderer/components/monaco-editor';
import { useEffect, useRef, useState } from 'react';
import { FormikProps, useFormik } from 'formik';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { nanoid } from '@reduxjs/toolkit';
import { CustomFunctionConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import {
    CheckboxInput,
    SelectInput,
    TextInput,
} from '@renderer/generators/api/components/inputs-form';
import { useTranslation } from 'react-i18next';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@renderer/components/ui/collapsible';
import { AlertDialog } from '@igrp/igrp-framework-react-design-system';
import * as Yup from 'yup';
import { PATTERNS } from '@renderer/constants/appConstants';
import { Label } from '@renderer/components/ui/label';
import { Separator } from '@renderer/components/ui/separator';

const returnTypeOptions = [
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'object', label: 'Object' },
    { value: 'array', label: 'Array' },
    { value: 'void', label: 'Void' },
    { value: 'any', label: 'Any' },
];

const SidebarAppCustomCode = ({ searchTerm }: { searchTerm: string }) => {
    const { functions, removeFunction } = useDroppedComponents();
    const [currentfunction, setCurrentFunction] =
        useState<CustomFunctionConfig | null>(null);
    const [openfnc, setOpenFnc] = useState<boolean>(false);

    const filteredFunctions =
        functions &&
        functions.filter((fnc) =>
            fnc.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const confirmDelete = () => {
        if (currentfunction) {
            removeFunction(currentfunction.id);
        }
        setCurrentFunction(null);
    };

    return (
        <>
            {filteredFunctions.length > 0 ? (
                <Collapsible
                    title={'Functions'}
                    defaultOpen
                    className="group/collapsible"
                >
                    <SidebarGroup>
                        <SidebarGroupLabel
                            asChild
                            className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                            <CollapsibleTrigger>
                                {'Functions'}
                                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {filteredFunctions.map((fnc, index) => (
                                        <SidebarMenuItem
                                            key={index}
                                            className="group/item relative"
                                        >
                                            <SidebarMenuButton asChild>
                                                <span className="pr-8">
                                                    {fnc.name}
                                                </span>
                                            </SidebarMenuButton>
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => {
                                                        setOpenFnc(true);
                                                        setCurrentFunction(fnc);
                                                    }}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <AlertDialog
                                                    onConfirm={confirmDelete}
                                                    recordId={fnc.name}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-destructive hover:text-destructive"
                                                        onClick={() =>
                                                            setCurrentFunction(
                                                                fnc
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </AlertDialog>
                                            </div>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>
            ) : (
                <div className="p-4">
                    <EmptyList
                        icon={<FunctionSquare />}
                        title="No Custom Code"
                        description="Create your first custom function, states or snippets, and any additional functionality your page needs!"
                        className="py-12"
                    />
                </div>
            )}

            {openfnc && (
                <FncComponent
                    open={openfnc}
                    setOpen={setOpenFnc}
                    funct={currentfunction}
                />
            )}
        </>
    );
};

const CustomCodeMenu = () => {
    const [openfnc, setOpenFnc] = useState<boolean>(false);
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={'outline'} size={'icon'}>
                        <Plus />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                    <DropdownMenuItem onClick={() => setOpenFnc(true)}>
                        <div className="flex flex-1 justify-between items-center">
                            <span>Function</span>
                            <ChevronRight className="w-8 h-8" />
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <div className="flex flex-1 justify-between items-center">
                            <span>State</span>
                            <ChevronRight className="w-8 h-8" />
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <div className="flex flex-1 justify-between items-center">
                            <span>Snippet</span>
                            <ChevronRight className="w-8 h-8" />
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            {openfnc && <FncComponent open={openfnc} setOpen={setOpenFnc} />}
        </>
    );
};

const FncComponent = ({
    open,
    setOpen,
    funct,
}: {
    funct?: any;
    open: boolean;
    setOpen: (prompt: boolean) => void;
}) => {
    const { addFunction, updateFunction } = useDroppedComponents();
    const codeRef = useRef<string>('');
    const importRef = useRef<string>('');
    const { t } = useTranslation();

    // Define return type options
    // Add this validation schema outside your component
    const functionValidationSchema = Yup.object().shape({
        name: Yup.string()
            .required(t('fieldRequired', { name: t('Function name') }))
            .matches(
                PATTERNS.SPECIAL_CHARACTERS,
                t('msgSpecialCharactersRegex')
            ),
        returnValue: Yup.object().shape({
            type: Yup.string().required(
                t('fieldRequired', { name: t('Return type') })
            ),
            nullable: Yup.boolean(),
            isList: Yup.boolean(),
        }),
    });

    const formik: FormikProps<CustomFunctionConfig> = useFormik({
        enableReinitialize: true,
        initialValues: funct || {
            id: '',
            name: '',
            code: '',
            returnValue: {
                type: 'string',
                nullable: true,
                isList: false,
            },
        },
        validationSchema: functionValidationSchema,
        onSubmit: (values, actions) => {
            try {
                const fncData = {
                    ...values,
                    code: codeRef.current,
                    imports: importRef.current,
                };

                if (fncData.id === '') {
                    addFunction({ ...fncData, id: `fnc_${nanoid(6)}` });
                } else {
                    updateFunction(fncData.id, fncData);
                }

                console.log('Function data:', fncData);
                setOpen(false);
            } catch (error) {
                console.error('Submission failed:', error);
            } finally {
                actions.setSubmitting(false);
            }
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 flex overflow-hidden [--header-height-three:calc(--spacing(75))] sm:max-w-[800px] lg:max-w-[900px]  max-w-[90vw] w-full">
                <SidebarInset>
                    <form
                        onSubmit={formik.handleSubmit}
                        className="space-y-4 p-4"
                    >
                        <DialogHeader>
                            <DialogTitle>
                                <div className="flex items-center gap-2 justify-between">
                                    <div>
                                        {funct
                                            ? 'Edit Function'
                                            : 'Create Function'}{' '}
                                        <span className="text-muted-foreground">
                                            {funct ? funct.name : ''}
                                        </span>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={
                                            formik.isSubmitting ||
                                            !formik.isValid
                                        }
                                        className="relative"
                                        size={'sm'}
                                    >
                                        {formik.isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {funct
                                                    ? 'Saving...'
                                                    : 'Creating...'}
                                            </>
                                        ) : funct ? (
                                            'Save changes'
                                        ) : (
                                            'Create Function'
                                        )}
                                    </Button>
                                </div>
                            </DialogTitle>
                            <DialogDescription />
                        </DialogHeader>

                        <div className="flex-1 border rounded">
                            <Label className="block text-sm font-medium text-foreground mb-2 p-2 border-b">
                                {t('Imports')}
                            </Label>
                            <MonacoEditor
                                content={funct?.imports || ''}
                                filePath=""
                                onChange={(newCode) => {
                                    importRef.current = newCode;
                                }}
                                height="15vh"
                                language="typescript"
                            />
                        </div>

                        <div className="flex-1 border rounded">
                            <Label className="block text-sm font-medium text-foreground mb-2 p-2 border-b">
                                {t('Function body')}
                            </Label>
                            <MonacoEditor
                                content={funct?.code || ''}
                                filePath=""
                                onChange={(newCode) => {
                                    codeRef.current = newCode;
                                }}
                                height="30vh"
                                language="typescript"
                            />
                        </div>
                    </form>
                </SidebarInset>
                <FunctionSettingsSidebar formik={formik} side="right" />
            </DialogContent>
        </Dialog>
    );
};

interface FunctionSettingsSidebarProps
    extends React.ComponentProps<typeof Sidebar> {
    formik?: any;
}

const FunctionSettingsSidebar = ({
    formik,
    ...props
}: FunctionSettingsSidebarProps) => {
    const { t } = useTranslation();

    const [arguments_, setArguments] = useState<any[]>(
        formik.values.arguments || []
    );

    const toggleArgumentExpand = (id: string) => {
        setArguments(
            arguments_.map((arg) =>
                arg.id === id ? { ...arg, isExpanded: !arg.isExpanded } : arg
            )
        );
    };

    const removeArgument = (id: string) => {
        setArguments(arguments_.filter((arg) => arg.id !== id));
    };

    const addArgument = () => {
        const newId = (
            Number.parseInt(arguments_[arguments_.length - 1]?.id || '0') + 1
        ).toString();
        setArguments([
            ...arguments_,
            {
                id: newId,
                name: '',
                type: 'String',
                isList: false,
                isNullable: false
            },
        ]);
    };

    const updateArgumentName = (id: string, name: string) => {
        setArguments(
            arguments_.map((arg) => (arg.id === id ? { ...arg, name } : arg))
        );
    };

    const updateArgumentType = (id: string, type: string) => {
        setArguments(
            arguments_.map((arg) => (arg.id === id ? { ...arg, type } : arg))
        );
    };

    const toggleArgumentNullable = (id: string) => {
        setArguments(
            arguments_.map((arg) =>
                arg.id === id ? { ...arg, isNullable: !arg.isNullable } : arg
            )
        );
    };

    const toggleArgumentList = (id: string) => {
        setArguments(
            arguments_.map((arg) =>
                arg.id === id ? { ...arg, isList: !arg.isList } : arg
            )
        );
    };

    useEffect(() => {
        formik.setFieldValue('arguments', arguments_);
    }, [arguments_]);

    return (
        <Sidebar
            {...props}
            collapsible="none"
            className="top-(--header-height-two)! h-[calc(100svh-var(--header-height-three))]!"
            style={
                {
                    '--sidebar-width': '18rem',
                } as React.CSSProperties
            }
        >
            <SidebarHeader>
                <div className="flex flex-col mt-2">
                    <h1 className="text-2xl font-bold mb-1">
                        Function Settings
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Manage your parameters below.
                    </p>
                </div>
            </SidebarHeader>
            <SidebarContent className="gap-4 p-2">
                <TextInput
                    label={t('name')}
                    id="name"
                    placeholder={t('enterName')}
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isTouched={formik.touched.name}
                    error={formik.errors.name}
                    isRequired
                />
                <Separator />
                <div className="flex flex-col gap-2">
                    <SelectInput
                        label={t('Return Type')}
                        id="returnValue.type"
                        value={formik.values.returnValue?.type}
                        onChange={(value) => {
                            formik.setFieldValue('returnValue.type', value);
                        }}
                        options={returnTypeOptions}
                    />

                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <CheckboxInput
                                label={t('Is List')}
                                id="returnValue.isList"
                                checked={formik.values.returnValue?.isList}
                                onChange={(checked) => {
                                    formik.setFieldValue(
                                        'returnValue.isList',
                                        checked
                                    );
                                }}
                                className="flex-1"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckboxInput
                                label={t('Nullable')}
                                id="returnValue.nullable"
                                checked={formik.values.returnValue?.nullable}
                                onChange={(checked) => {
                                    formik.setFieldValue(
                                        'returnValue.nullable',
                                        checked
                                    );
                                }}
                                className="flex-1"
                            />
                        </div>
                    </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-2">
                    <Label>Define Arguments</Label>
                    <div className="space-y-2">
                        {arguments_.map((arg) => (
                            <div
                                key={arg.id}
                                className="bg-card border rounded-lg overflow-hidden"
                            >
                                <div
                                    className="flex items-center justify-between p-3 cursor-pointer"
                                    onClick={() => toggleArgumentExpand(arg.id)}
                                >
                                    <div className="flex items-center">
                                        <span className="font-medium">
                                            Arguments {arg.id}
                                        </span>
                                        <span className="ml-2 text-gray-400 text-sm">
                                            {arg.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <button
                                            className="text-destructive mr-2 text-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeArgument(arg.id);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                            <span className="sr-only">
                                                Remove
                                            </span>
                                        </button>
                                        {arg.isExpanded ? (
                                            <ChevronDown className="h-5 w-5" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5" />
                                        )}
                                    </div>
                                </div>

                                {arg.isExpanded && (
                                    <div className="p-3 border-t space-y-4">
                                        <TextInput
                                            id={`argName-${arg.id}`}
                                            label={t('Name')}
                                            value={arg.name}
                                            onChange={(e) =>
                                                updateArgumentName(
                                                    arg.id,
                                                    e.target.value
                                                )
                                            }
                                        />

                                        <div className="space-y-2">
                                            <SelectInput
                                                label={t('Type')}
                                                id="type"
                                                value={arg.type}
                                                onChange={(value) =>
                                                    updateArgumentType(
                                                        arg.id,
                                                        value as string
                                                    )
                                                }
                                                options={returnTypeOptions}
                                            />
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center space-x-2">
                                                    <CheckboxInput
                                                        id={`isList-${arg.id}`}
                                                        checked={arg.isList}
                                                        onChange={() =>
                                                            toggleArgumentList(
                                                                arg.id
                                                            )
                                                        }
                                                        label="Is List"
                                                    />
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <CheckboxInput
                                                        id={`isNullable-${arg.id}`}
                                                        checked={arg.isNullable}
                                                        onChange={() =>
                                                            toggleArgumentNullable(
                                                                arg.id
                                                            )
                                                        }
                                                        label="Nullable"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <Button onClick={addArgument} className="mt-4 w-full">
                        <Plus className="h-4 w-4 mr-2" /> Add Arguments
                    </Button>
                </div>
            </SidebarContent>
        </Sidebar>
    );
};

export { SidebarAppCustomCode, CustomCodeMenu };
