import { Plus, Trash2, Edit2, Mouse } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { Button } from '@renderer/components/ui/button';
import MonacoEditor from '@renderer/components/monaco-editor';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import { useEffect, useRef, useState } from 'react';
import { DialogDescription } from '@radix-ui/react-dialog';
import { Label } from '@renderer/components/ui/label';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import useCustomCode from '../../../../hooks/useCustomCode';
import { ImportComponent } from '../../../sidebar/custom-code/custom-code-imports';
import { Import } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { SidebarInset } from '@renderer/components/ui/sidebar';
import { FunctionSettingsSidebar } from '../../../sidebar/custom-code/functions-settings';
import { getId } from '@renderer/utils/helpers';
import { useComponents } from '@renderer/generators/ui/hooks/useComponents';
import useStudio from '@renderer/hooks/use-studio';

type ActionType = 'function' | 'navigate' | 'formSubmit';

const actionTypeOptions = [
    { value: 'function', label: 'Function' },
    { value: 'navigate', label: 'Navigation' },
    { value: 'formSubmit', label: 'Form Submit' },
];

interface NavigationAction {
    name: string;
    path: string;
    params?: Record<string, string>;
}

interface FormSubmitAction {
    formId: string;
    targetForm: string;
    validation?: boolean;
}

interface Action {
    type: ActionType;
    function?: {
        fnName?: string;
        fnCustomSet?: string;
        fnCustomCode?: {
            fnCode?: string;
            imports?: Import[];
        };
    };
    navigate?: NavigationAction;
    formSubmit?: FormSubmitAction;
}

interface TriggerControlsProps {
    interactions: Action;
    interactionsType: any;
    componentTag: string;
    onInteractionsChange: (interactions: Action) => void;
}

interface InteractionEditorProps {
    interaction: Action;
    interactionKey: string;
    open: boolean;
    setOpen: (open: boolean) => void;
    onInteractionsChange: (interactions: Action) => void;
    interactionsType: any;
    setLocalInteractions: (interactions: Action) => void;
    localInteractions: Action;
    componentTag: string;
}

export function TriggerControls({
    interactions,
    interactionsType,
    componentTag,
    onInteractionsChange,
}: TriggerControlsProps) {
    const [localInteractions, setLocalInteractions] = useState<Action>({
        type: 'function',
    });

    useEffect(() => {
        setLocalInteractions(interactions);
    }, [interactions]);

    const addInteraction = (int: string) => {
        const updated = {
            ...localInteractions,
            [int]: {},
        };

        onInteractionsChange(updated);
        setLocalInteractions(updated);
    };

    const removeInteraction = (key: string) => {
        const newInteractions = { ...localInteractions };
        delete newInteractions[key];
        setLocalInteractions(newInteractions);
        onInteractionsChange(newInteractions);
    };

    const AddDropdown = () => {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={'secondary'} size={'sm'}>
                        <Plus size={10} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-60">
                    {Object.keys(interactionsType).map((key, index) => {
                        const interaction = interactionsType[key];
                        return (
                            <DropdownMenuItem
                                key={index}
                                onClick={() => addInteraction(key)}
                            >
                                {interaction?.label || key}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    const [open, setOpen] = useState(false);
    const [interaction, setInteraction] = useState<Action>();
    const [interactionKey, setInteractionKey] = useState<string>();

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Mouse size={16} />
                    Trigger Element
                </h3>
                <div className="flex items-center gap-1">
                    <AddDropdown />
                </div>
            </div>

            <div className="space-y-1">
                {Object.entries(localInteractions).map(
                    ([key, interaction], index) => {
                        return (
                            <div
                                key={index}
                                className="group flex items-center gap-2 p-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 rounded transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {interactionsType[key]?.label || key}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant={'ghost'}
                                        size={'icon'}
                                        onClick={() => {
                                            setOpen(true);
                                            setInteraction(interaction);
                                            setInteractionKey(key);
                                        }}
                                        className="w-6 h-6"
                                    >
                                        <Edit2 size={4} />
                                    </Button>
                                    <Button
                                        variant={'ghost'}
                                        size={'sm'}
                                        onClick={() => removeInteraction(key)}
                                    >
                                        <Trash2
                                            size={4}
                                            className="text-destructive"
                                        />
                                    </Button>
                                </div>
                            </div>
                        );
                    }
                )}
            </div>

            {open && interaction && interactionKey && (
                <InteractionEditor
                    open={open}
                    setOpen={setOpen}
                    interaction={interaction}
                    interactionKey={interactionKey}
                    onInteractionsChange={onInteractionsChange}
                    interactionsType={interactionsType}
                    setLocalInteractions={setLocalInteractions}
                    localInteractions={localInteractions}
                    componentTag={componentTag}
                />
            )}
        </div>
    );
}

const InteractionEditor = ({
    interaction,
    interactionKey,
    open,
    setOpen,
    onInteractionsChange,
    interactionsType,
    setLocalInteractions,
    localInteractions,
    componentTag,
}: InteractionEditorProps) => {
    const [actionType, setActionType] = useState<ActionType>(
        interaction.type || 'function'
    );
    const [currentAction, setCurrentAction] = useState<Action>(interaction);

    const { pageOptions: availablePages } = useStudio();
    const { getFormOptions } = useComponents();
    const availableForms = getFormOptions();

    // Refs e states para diferentes editores
    const fnCustomSetEditorRef = useRef<any>(null);
    const fnCustomCodeEditorRef = useRef<any>(null);

    /*     // Dados para navegação
    const [selectedPage, setSelectedPage] = useState<{
        id: string;
        name: string;
    } | null>(null);

    const [navigationParams, setNavigationParams] = useState<
        Record<string, string>
    >({});

    // Dados para submit de formulário
    const [selectedForm, setSelectedForm] = useState<{
        id: string;
        name: string;
    } | null>(null); */

    const fnCustomSetRef = useRef<string>('');
    const fnCustomCodeRef = useRef<string>('');

    const [imports, setImports] = useState<Import[]>(
        currentAction?.function?.fnCustomCode?.imports || []
    );

    const { functionOptions } = useCustomCode();

    const interactions = interactionsType[interactionKey];

    const { properties } = interactions;

    const hasfnNameOption = properties?.function?.properties.fnName.visible;

    const hasfnCustomSetOption =
        properties?.function?.properties.fnCustomSet.visible;

    const hasfnCodeOption =
        properties?.function?.properties.fnCustomCode?.properties?.fnCode
            ?.visible;

    const hasImportOption =
        properties?.function?.properties.fnCustomCode.properties?.imports
            ?.visible;

    const saveInteraction = () => {
        const updated = {
            ...localInteractions,
            [interactionKey]: currentAction,
        };

        setLocalInteractions(updated);
        onInteractionsChange(updated);

        setOpen(false);
        fnCustomCodeRef.current = '';
        fnCustomSetRef.current = '';
    };

    const handleChangeFnName = (fnName: string) => {
        if (!fnName) return;

        const functionOption = functionOptions.find(
            (option) => option.value === fnName
        );

        const namespace = `import {${fnName}} from '${functionOption?.metadata?.path}'`;

        setImports?.((prev) => [
            ...prev,
            {
                namespace,
                id: getId(),
            },
        ]);

        setCurrentAction({
            ...currentAction,
            function: {
                ...currentAction.function,
                fnName: fnName,
            },
        });
    };

    const handleChangeImport = (importObj: Import) => {
        setImports?.((prev) => [...prev, importObj]);
    };

    useEffect(() => {
        setCurrentAction({
            ...currentAction,
            function: {
                ...currentAction.function,
                fnCustomCode: {
                    ...currentAction.function?.fnCustomCode,
                    imports: imports,
                },
            },
        });
    }, [imports]);

    const renderActionConfig = () => {
        switch (actionType) {
            case 'function':
                return (
                    <div className="space-y-4">
                        {hasfnNameOption && (
                            <IGRPCombobox
                                label={'Function'}
                                placeholder="Select Function"
                                name="select-function"
                                value={currentAction.function?.fnName}
                                onChange={(value) =>
                                    handleChangeFnName(value as string)
                                }
                                options={functionOptions}
                            />
                        )}
                        {hasImportOption && (
                            <ImportComponent
                                initialImports={imports}
                                onChange={(imports) => setImports(imports)}
                            />
                        )}
                        {hasfnCustomSetOption && (
                            <div className="flex-1 border rounded">
                                <Label className="block text-sm font-medium text-foreground mb-2 p-2 border-b">
                                    Inline Function
                                </Label>
                                <MonacoEditor
                                    content={
                                        currentAction.function?.fnCustomSet ||
                                        ''
                                    }
                                    filePath=""
                                    onChange={(newCode) =>
                                        setCurrentAction({
                                            ...currentAction,
                                            function: {
                                                ...currentAction.function,
                                                fnCustomSet: newCode,
                                            },
                                        })
                                    }
                                    height="5vh"
                                    language="typescript"
                                    ref={fnCustomSetEditorRef}
                                />
                            </div>
                        )}

                        {hasfnCodeOption && (
                            <div className="flex-1 border rounded">
                                <Label className="block text-sm font-medium text-foreground mb-2 p-2 border-b">
                                    Custom Code
                                </Label>
                                <MonacoEditor
                                    content={
                                        currentAction.function?.fnCustomCode
                                            ?.fnCode || ''
                                    }
                                    filePath=""
                                    onChange={(newCode) =>
                                        setCurrentAction({
                                            ...currentAction,
                                            function: {
                                                ...currentAction.function,
                                                fnCustomCode: {
                                                    ...currentAction.function
                                                        ?.fnCustomCode,
                                                    fnCode: newCode,
                                                },
                                            },
                                        })
                                    }
                                    height="40vh"
                                    language="typescript"
                                    ref={fnCustomCodeEditorRef}
                                />
                            </div>
                        )}
                    </div>
                );

            case 'navigate':
                return (
                    <div className="space-y-4">
                        <IGRPCombobox
                            label="Target Page"
                            placeholder="Select page"
                            value={
                                currentAction.navigate?.name
                                    ? currentAction.navigate.name.replace(
                                          'onClick',
                                          ''
                                      )
                                    : ''
                            }
                            onChange={(id) => {
                                const page = availablePages.find(
                                    (p) => p.value === id
                                );
                                console.log(page);
                                if (page) {
                                    setCurrentAction({
                                        ...currentAction,
                                        navigate: {
                                            path: page.metadata.path,
                                            name: `onClick${id}`,
                                        },
                                    });
                                }
                            }}
                            options={availablePages}
                        />

                        {/*  <div className="space-y-2">
                            <Label>Navigation Parameters</Label>
                            {Object.entries(navigationParams).map(
                                ([key, value]) => (
                                    <div key={key} className="flex gap-2">
                                        <Input value={key} disabled />
                                        <Input
                                            value={value}
                                            onChange={(e) =>
                                                setNavigationParams({
                                                    ...navigationParams,
                                                    [key]: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                )
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    setNavigationParams({
                                        ...navigationParams,
                                        [`param${Object.keys(navigationParams).length + 1}`]:
                                            '',
                                    })
                                }
                            >
                                Add Parameter
                            </Button>
                        </div> */}
                    </div>
                );

            case 'formSubmit':
                return (
                    <div className="space-y-4">
                        <IGRPCombobox
                            label="Target Form"
                            placeholder="Select form"
                            value={currentAction.formSubmit?.targetForm}
                            onChange={(form) => {
                                setCurrentAction({
                                    ...currentAction,
                                    formSubmit: {
                                        formId: '',
                                        targetForm: form as string,
                                    },
                                });
                            }}
                            options={availableForms}
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 flex overflow-hidden [--header-height-three:calc(--spacing(75))] w-full sm:max-w-[800px] lg:max-w-[70vw] max-w-[90vw]">
                <SidebarInset className="p-4 space-y-4">
                    <DialogHeader>
                        <div className="flex flex-1 justify-between">
                            <div className="space-y-2">
                                <DialogTitle>Edit Interaction</DialogTitle>
                                <DialogDescription>
                                    Configure what happens when this interaction
                                    is triggered
                                </DialogDescription>
                            </div>
                            <div>
                                <Button
                                    size={'sm'}
                                    onClick={() => saveInteraction()}
                                >
                                    Save changes
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="space-y-4">
                        <IGRPCombobox
                            label="Action Type"
                            placeholder="Select action type"
                            name="action-type"
                            value={actionType}
                            onChange={(value) => {
                                setCurrentAction({
                                    ...currentAction,
                                    type: value as ActionType,
                                });
                                setActionType(value as ActionType);
                            }}
                            options={actionTypeOptions}
                        />

                        {renderActionConfig()}
                    </div>
                </SidebarInset>
                {/* Sidebar com configurações adicionais */}
                {actionType === 'function' && (
                    <FunctionSettingsSidebar
                        editorRef={
                            hasfnCodeOption
                                ? fnCustomCodeEditorRef
                                : fnCustomSetEditorRef
                        }
                        onInsertImport={(importObj) => {
                            handleChangeImport(importObj);
                        }}
                        componentTag={componentTag}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};
