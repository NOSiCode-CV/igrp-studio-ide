import {
    SidebarGroup,
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
    CodeSnippetsRegisterConfig,
    CustomFunctionConfig,
    State,
} from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { useTranslation } from 'react-i18next';
import { AlertDialog } from '@igrp/igrp-framework-react-design-system';
import * as Yup from 'yup';
import { PATTERNS } from '@renderer/constants/appConstants';
import { Label } from '@renderer/components/ui/label';
import { StateComponent } from './custom-code-state';
import useCustomCode from '../../../hooks/useCustomCode';
import { SnnipetComponent } from './custom-code-snippet';
import { ImportComponent } from './custom-code-imports';
import { FunctionSettingsSidebar } from './functions-settings';

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
    const { removeFunction, removeState } = useDroppedComponents();

    const { snippets, functions, states, isLoading } = useCustomCode();

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
    console.log(openfnc);
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
        initialValues: {
            id: '',
            name: '',
            code: '',
            returnValue: {
                type: 'void',
                isNullable: true,
                isList: false,
            },
            imports: [],
            ...funct,
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
                    componentTag={''}
                />
            </DialogContent>
        </Dialog>
    );
};

export { SidebarAppCustomCode, CustomCodeMenu };
