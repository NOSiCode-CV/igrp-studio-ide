import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@renderer/components/ui/sidebar';
import {
    ChevronRight,
    FunctionSquare,
    Loader,
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
import { useDroppedComponents } from '../../../dnd/DroppedComponentsContext';
import { nanoid } from '@reduxjs/toolkit';
import {
    Argument,
    CodeSnippetsRegisterConfig,
    CustomFunctionConfig,
    State,
} from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import {
    CheckboxInput,
    SelectInput,
    TextInput,
} from '@renderer/generators/api/components/inputs-form';
import { useTranslation } from 'react-i18next';
import { AlertDialog } from '@igrp/igrp-framework-react-design-system';
import * as Yup from 'yup';
import { PATTERNS } from '@renderer/constants/appConstants';
import { Label } from '@renderer/components/ui/label';
import { Separator } from '@renderer/components/ui/separator';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@renderer/components/ui/accordion';
import { StateComponent } from './custom-code-state';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import useCustomCode from '../../../hooks/useCustomCode';
import { SnnipetComponent } from './custom-code-snippet';
import { ImportComponent } from './custom-code-imports';
import { TabsFunctions, TabSnipptes, TabStates } from './custom-code-tabs';

const returnTypeOptions = [
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'object', label: 'Object' },
    { value: 'array', label: 'Array' },
    { value: 'void', label: 'Void' },
    { value: 'any', label: 'Any' },
];

interface FunctionSettingsSidebarProps
    extends React.ComponentProps<typeof Sidebar> {
    formik?: any;
    editorRef?: React.RefObject<any>;
}

interface ResourceListProps<T> {
    title: string;
    items: T[];
    searchTerm: string;
    onEdit: (item: T) => void;
    onDelete?: (item: T) => void;
    renderItemName: (item: T) => string;
    editModal?: React.ReactNode;
}

const SidebarAppCustomCode = ({ searchTerm }: { searchTerm: string }) => {
    const { states, removeFunction, removeState } = useDroppedComponents();

    const { snippets, functions, isLoading } = useCustomCode();

    const [currentFunction, setCurrentFunction] =
        useState<CustomFunctionConfig | null>(null);
    const [currentState, setCurrentState] = useState<State | null>(null);
    const [currentSnnipet, setCurrentSnippet] =
        useState<CodeSnippetsRegisterConfig | null>(null);
    const [openFnc, setOpenFnc] = useState(false);
    const [openState, setOpenState] = useState(false);
    const [openSnippet, setOpenSnippet] = useState(false);

    const hasResources =
        functions.length > 0 || states.length > 0 || snippets.length > 0;

    return (
        <>
            {isLoading ? (
                <div className="flex items-center justify-center h-screen">
                    <Loader />
                </div>
            ) : hasResources ? (
                <>
                    <ResourceList
                        title="Functions"
                        items={functions}
                        searchTerm={searchTerm}
                        onEdit={(fnc) => {
                            setCurrentFunction(fnc);
                            setOpenFnc(true);
                        }}
                        onDelete={(fnc) => removeFunction(fnc.id)}
                        renderItemName={(fnc) => fnc.name}
                        editModal={
                            openFnc && (
                                <FncComponent
                                    open={openFnc}
                                    setOpen={setOpenFnc}
                                    funct={currentFunction}
                                />
                            )
                        }
                    />

                    <ResourceList
                        title="States"
                        items={states}
                        searchTerm={searchTerm}
                        onEdit={(state) => {
                            setCurrentState(state);
                            setOpenState(true);
                        }}
                        onDelete={(state) => removeState(state.id)}
                        renderItemName={(state) => state.name}
                        editModal={
                            openState && (
                                <StateComponent
                                    open={openState}
                                    setOpen={setOpenState}
                                    state={currentState}
                                />
                            )
                        }
                    />

                    <ResourceList
                        title="Snippets"
                        items={snippets}
                        searchTerm={searchTerm}
                        onEdit={(snippet) => {
                            setCurrentSnippet(snippet);
                            setOpenSnippet(true);
                        }}
                        renderItemName={(snippet) => snippet.title}
                        editModal={
                            openSnippet && (
                                <SnnipetComponent
                                    open={openSnippet}
                                    setOpen={setOpenSnippet}
                                    snippet={currentSnnipet}
                                />
                            )
                        }
                    />
                </>
            ) : (
                <div className="p-4">
                    <EmptyList
                        icon={<FunctionSquare />}
                        title="No Functions"
                        description="Create your first custom function to add functionality to your page!"
                        className="py-12"
                    />
                </div>
            )}
        </>
    );
};

const ResourceList = <T extends { id?: string; name: string }>({
    title,
    items,
    searchTerm,
    onEdit,
    onDelete,
    renderItemName,
    editModal,
}: ResourceListProps<T>) => {
    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            {filteredItems.length > 0 && (
                <>
                    <SidebarGroup>
                        <SidebarMenu>
                            <SidebarMenuItem key={title}>
                                <SidebarMenuButton asChild>
                                    <span className="font-medium">{title}</span>
                                </SidebarMenuButton>
                                <SidebarMenuSub>
                                    {filteredItems.map((item, index) => (
                                        <SidebarMenuSubItem key={index}>
                                            <SidebarMenuSubButton asChild>
                                                <div className="flex items-center justify-between w-full group/item relative">
                                                    <span className="">
                                                        {renderItemName(item)}
                                                    </span>
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2  opacity-0 group-hover/item:opacity-100">
                                                        {onDelete &&
                                                            item.id && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6"
                                                                    onClick={() =>
                                                                        onEdit(
                                                                            item
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        {onDelete &&
                                                            item.id && (
                                                                <AlertDialog
                                                                    onConfirm={() =>
                                                                        onDelete(
                                                                            item
                                                                        )
                                                                    }
                                                                    recordId={
                                                                        item.name
                                                                    }
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 text-destructive hover:text-destructive"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </AlertDialog>
                                                            )}
                                                    </div>
                                                </div>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                </>
            )}
            {editModal}
        </>
    );
};

const CustomCodeMenu = () => {
    const [openfnc, setOpenFnc] = useState<boolean>(false);
    const [openState, setOpenState] = useState<boolean>(false);
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
                    <DropdownMenuItem onClick={() => setOpenState(true)}>
                        <div className="flex flex-1 justify-between items-center">
                            <span>State</span>
                            <ChevronRight className="w-8 h-8" />
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            {openfnc && <FncComponent open={openfnc} setOpen={setOpenFnc} />}
            {openState && (
                <StateComponent open={openState} setOpen={setOpenState} />
            )}
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
                type: 'void',
                isNullable: true,
                isList: false,
            },
            imports: [],
        },
        validationSchema: functionValidationSchema,
        onSubmit: (values, actions) => {
            try {
                const fncData: CustomFunctionConfig = {
                    ...values,
                    code: codeRef.current,
                };

                if (fncData.id === '') {
                    addFunction({
                        ...fncData,
                        id: `fnc_${nanoid(6).replace(/-/g, '')}`,
                    });
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

    useEffect(() => {
        if (funct) {
            codeRef.current = funct.code;
        }
    }, [funct]);

    const editorRef = useRef<any>(null);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 flex overflow-hidden [--header-height-three:calc(--spacing(75))] w-full sm:max-w-[800px] lg:max-w-[70vw] max-w-[90vw]">
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

                        <ImportComponent
                            initialImports={funct?.imports || []}
                            onChange={(imports) =>
                                formik.setFieldValue('imports', imports)
                            }
                        />

                        <div className="flex-1 border rounded">
                            <Label className="block text-sm font-medium text-foreground mb-2 p-2 border-b">
                                {t('Function body')}
                            </Label>
                            <MonacoEditor
                                ref={editorRef}
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
                <FunctionSettingsSidebar
                    formik={formik}
                    editorRef={editorRef}
                    side="right"
                />
            </DialogContent>
        </Dialog>
    );
};

const FunctionSettingsSidebar = ({
    formik,
    editorRef,
    ...props
}: FunctionSettingsSidebarProps) => {
    const { t } = useTranslation();

    const { states, snippets, functions } = useCustomCode();

    const [arguments_, setArguments] = useState<Argument[]>(
        formik.values.arguments || []
    );

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
                isNullable: false,
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
                    '--sidebar-width': '380px',
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
                <Tabs defaultValue="props">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="props">Props</TabsTrigger>
                        <TabsTrigger value="states">States</TabsTrigger>
                        <TabsTrigger value="snippets">Snippets</TabsTrigger>
                        <TabsTrigger value="functions">Functions</TabsTrigger>
                    </TabsList>
                    <TabsContent value="props" className="space-y-4">
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
                                    formik.setFieldValue(
                                        'returnValue.type',
                                        value
                                    );
                                }}
                                options={returnTypeOptions}
                            />

                            <div className="flex items-center gap-4">
                                <div className="flex items-center space-x-2">
                                    <CheckboxInput
                                        label={t('Is List')}
                                        id="returnValue.isList"
                                        value={
                                            formik.values.returnValue?.isList
                                        }
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
                                        id="returnValue.isNullable"
                                        value={
                                            formik.values.returnValue
                                                ?.isNullable
                                        }
                                        onChange={(checked) => {
                                            formik.setFieldValue(
                                                'returnValue.isNullable',
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
                            <Accordion
                                type="single"
                                collapsible
                                className="w-full"
                            >
                                {arguments_.map((arg, index) => (
                                    <AccordionItem
                                        value={`argName-${index}`}
                                        key={index}
                                    >
                                        <AccordionTrigger>
                                            <div className="flex justify-between items-center w-full">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">
                                                        Arguments {arg.id}
                                                    </span>
                                                    <span className=" text-gray-400 text-sm">
                                                        {arg.type}
                                                    </span>
                                                </div>
                                                <button
                                                    className="text-destructive text-sm"
                                                    onClick={() => {
                                                        removeArgument(arg.id);
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                    <span className="sr-only">
                                                        Remove
                                                    </span>
                                                </button>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="p-2 border-t space-y-3">
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
                                                        options={
                                                            returnTypeOptions
                                                        }
                                                    />
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center space-x-2">
                                                            <CheckboxInput
                                                                id={`isList-${arg.id}`}
                                                                value={
                                                                    arg.isList
                                                                }
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
                                                                value={
                                                                    arg.isNullable
                                                                }
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
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                            <Button onClick={addArgument} className="w-full">
                                <Plus className="h-4 w-4 mr-2" /> Add Arguments
                            </Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="states" className="space-y-4">
                        <TabStates states={states} editorRef={editorRef} />
                    </TabsContent>
                    <TabsContent value="snippets" className="space-y-4">
                        <TabSnipptes
                            snippets={snippets}
                            editorRef={editorRef}
                        />
                    </TabsContent>
                    <TabsContent value="functions" className="space-y-4">
                        <TabsFunctions
                            functions={functions}
                            editorRef={editorRef}
                            currentFunction={formik.values}
                        />
                    </TabsContent>
                </Tabs>
            </SidebarContent>
        </Sidebar>
    );
};

export { SidebarAppCustomCode, CustomCodeMenu };
