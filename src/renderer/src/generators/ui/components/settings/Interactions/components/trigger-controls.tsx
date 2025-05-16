import { Plus, Trash2, Edit2, Mouse } from 'lucide-react';
import { InteractionValue } from '../../style/components/effects/types';
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

interface TriggerControlsProps {
    interactions: Record<string, InteractionValue>;
    interactionsType: any;
    componentTag: string;
    onInteractionsChange: (
        interactions: Record<string, InteractionValue>
    ) => void;
}

const mapPropertyOptions = (properties: Record<string, any> = {}) => {
    return Object.entries(properties)
        .filter(([_, prop]) => prop.visible)
        .map(([key, prop]) => ({
            value: key,
            label:
                prop.label ||
                key
                    .replace(/([A-Z])/g, ' $1') // Add space before capitals
                    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
                    .trim(),
        }));
};

export function TriggerControls({
    interactions,
    interactionsType,
    onInteractionsChange,
}: TriggerControlsProps) {
    const [localInteractions, setLocalInteractions] = useState<
        Record<string, InteractionValue>
    >({});

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
        // codeRef.current = fnCustomSet;
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
    const [interaction, setInteraction] = useState<InteractionValue>();
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
}: {
    interaction: InteractionValue;
    interactionKey: string;
    open: boolean;
    setOpen: (open: boolean) => void;
    onInteractionsChange: (
        interactions: Record<string, InteractionValue>
    ) => void;
    interactionsType: any;
    localInteractions: Record<string, InteractionValue>;
    setLocalInteractions: (
        localInteractions: Record<string, InteractionValue>
    ) => void;
}) => {
    const fnCustomSetEditorRef = useRef<any>(null);
    const fnCustomCodeEditorRef = useRef<any>(null);

    const fnCustomSetRef = useRef<string>('');
    const fnCustomCodeRef = useRef<string>('');
    const [imports, setImports] = useState<Import[]>(
        interaction.fnCustomCode?.imports || []
    );
    const [fnName, setFnName] = useState<string>('');

    const { functionOptions } = useCustomCode();

    const interactions = interactionsType[interactionKey];

    const propertyOptions = mapPropertyOptions(interactions?.properties);
    const hasfnNameOption = propertyOptions.find(
        (opt) => opt.value === 'fnName'
    );

    const hasfnCustomSetOption = propertyOptions.find(
        (opt) => opt.value === 'fnCustomSet'
    );

    const hasfnCustomCodeOption = propertyOptions.find(
        (opt) => opt.value === 'fnCustomCode'
    );

    const updateInteraction = (
        key: string,
        field: keyof InteractionValue,
        value: any
    ) => {
        const updated = {
            ...localInteractions,
            [key]: { ...localInteractions[key], [field]: value },
        };

        setLocalInteractions(updated);
        onInteractionsChange(updated);
    };

    const saveInteraction = (key: string) => {
        if (fnCustomSetRef.current)
            updateInteraction(key, 'fnCustomSet', fnCustomSetRef.current);
        if (fnName) updateInteraction(key, 'fnName', fnName);

        if (hasfnCustomCodeOption) {
            updateInteraction(key, 'fnCustomCode', {
                fnCode: fnCustomCodeRef.current,
                imports,
            });
        }

        setOpen(false);
        fnCustomCodeRef.current = '';
        fnCustomSetRef.current = '';
    };

    const handleInsertImport = (importObj: Import) => {
        setImports?.((prev) => [...prev, importObj]);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 flex overflow-hidden [--header-height-three:calc(--spacing(75))] w-full sm:max-w-[800px] lg:max-w-[70vw] max-w-[90vw]">
                <SidebarInset className="p-4 space-y-4">
                    <DialogHeader>
                        <div className="flex flex-1 justify-between">
                            <div className="space-y-2">
                                <DialogTitle>
                                    Edit Interaction{' '}
                                    <span className="text-muted-foreground">
                                        {interactionKey + 1}
                                    </span>
                                </DialogTitle>
                                <DialogDescription>
                                    Either select a function below or write your
                                    custom implementation
                                </DialogDescription>
                            </div>
                            <div>
                                <Button
                                    size={'sm'}
                                    onClick={() =>
                                        saveInteraction(interactionKey)
                                    }
                                >
                                    Save changes
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="space-y-2">
                        {hasfnNameOption && (
                            <IGRPCombobox
                                label={'Function'}
                                placeholder="Select Function"
                                name="select-function"
                                value={interaction.fnName}
                                onChange={(value) => {
                                    setFnName(value as string);
                                }}
                                options={functionOptions}
                            />
                        )}
                        {hasfnCustomSetOption && (
                            <div className="flex-1 border rounded">
                                <Label className="block text-sm font-medium text-foreground mb-2 p-2 border-b">
                                    Inline Function
                                </Label>
                                <MonacoEditor
                                    content={interaction.fnCustomSet || ''}
                                    filePath=""
                                    onChange={(newCode) => {
                                        fnCustomSetRef.current = newCode;
                                    }}
                                    height="5vh"
                                    language="typescript"
                                    ref={fnCustomSetEditorRef}
                                />
                            </div>
                        )}
                        {hasfnCustomCodeOption && (
                            <>
                                <ImportComponent
                                    initialImports={imports}
                                    onChange={(value) => setImports(value)}
                                />
                                <div className="flex-1 border rounded">
                                    <Label className="block text-sm font-medium text-foreground mb-2 p-2 border-b">
                                        Custom Code
                                    </Label>
                                    <MonacoEditor
                                        content={
                                            interaction.fnCustomCode?.fnCode ||
                                            ''
                                        }
                                        filePath=""
                                        onChange={(newCode) => {
                                            fnCustomCodeRef.current = newCode;
                                        }}
                                        height="40vh"
                                        language="typescript"
                                        ref={fnCustomCodeEditorRef}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </SidebarInset>
                <FunctionSettingsSidebar
                    formik={null}
                    editorRef={
                        hasfnCustomCodeOption
                            ? fnCustomCodeEditorRef
                            : fnCustomSetEditorRef
                    }
                    side="right"
                    onInsertImport={handleInsertImport}
                />
            </DialogContent>
        </Dialog>
    );
};
