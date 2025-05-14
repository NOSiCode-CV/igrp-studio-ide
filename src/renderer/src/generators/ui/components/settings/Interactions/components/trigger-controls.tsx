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
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import { useEffect, useRef, useState } from 'react';
import { DialogDescription } from '@radix-ui/react-dialog';
import { Label } from '@renderer/components/ui/label';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import useCustomCode from '../../../../hooks/useCustomCode';

interface TriggerControlsProps {
    interactions: Record<string, InteractionValue>;
    interactionsType: any;
    componentTag: string;
    onInteractionsChange: (
        interactions: Record<string, InteractionValue>
    ) => void;
}

export function TriggerControls({
    interactions,
    interactionsType,
    componentTag,
    onInteractionsChange,
}: TriggerControlsProps) {
    const [localInteractions, setLocalInteractions] = useState<
        Record<string, InteractionValue>
    >({});

    const { functionOptions } = useCustomCode();

    const codeRef = useRef<string>('');
    const functionRef = useRef<any>('');

    useEffect(() => {
        setLocalInteractions(interactions);
    }, [interactions]);

    const addInteraction = (int: string, interaction: Record<string, any>) => {
        const fnCustomSet = interaction?.properties?.fnCustomSet.default
            ? interaction?.properties.fnCustomSet.default.replace(
                  '{{id}}',
                  componentTag
              )
            : '';

        const updated = {
            ...localInteractions,
            [int]: {
                fnCustomSet,
            },
        };

        onInteractionsChange(updated);
        setLocalInteractions(updated);
        codeRef.current = fnCustomSet;
    };

    const removeInteraction = (key: string) => {
        const newInteractions = { ...localInteractions };
        delete newInteractions[key];
        setLocalInteractions(newInteractions);
        onInteractionsChange(newInteractions);
    };

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
        updateInteraction(key, 'fnCustomSet', codeRef.current);
        updateInteraction(key, 'fnName', functionRef.current);
        setOpen(false);
        setInteraction(undefined);
        setInteractionKey(undefined);
        codeRef.current = '';
        functionRef.current = '';
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
                                onClick={() => addInteraction(key, interaction)}
                            >
                                {interaction?.label || key}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    const InteractionEditor = ({
        interaction,
        interactionKey,
        open,
        setOpen,
    }: {
        interaction: InteractionValue;
        interactionKey: string;
        open: boolean;
        setOpen: (open: boolean) => void;
    }) => (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="flex flex-col overflow-hidden [--header-height-three:calc(--spacing(75))] sm:max-w-[800px] lg:max-w-[900px] max-w-7xl max:h-[70vh]">
                <DialogHeader>
                    <DialogTitle>
                        Edit Interaction{' '}
                        <span className="text-muted-foreground">
                            {interactionKey + 1}
                        </span>
                    </DialogTitle>
                    <DialogDescription>
                        Either select a function below or write your custom
                        implementation
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <IGRPCombobox
                        ref={functionRef}
                        label={'Function'}
                        placeholder="Select Function"
                        name="select-function"
                        value={interaction.fnName}
                        onChange={(value) => {
                            functionRef.current = value as string;
                        }}
                        options={functionOptions}
                    />
                    <div className="flex-1 border rounded">
                        <Label className="block text-sm font-medium text-foreground mb-2 p-2 border-b">
                            Inline Function
                        </Label>
                        <MonacoEditor
                            content={interaction.fnCustomSet || ''}
                            filePath=""
                            onChange={(newCode) => {
                                codeRef.current = newCode;
                            }}
                            height="30vh"
                            language="typescript"
                        />
                    </div>
                </div>
                <DialogFooter className="space-x-2">
                    <DialogClose>Close</DialogClose>
                    <Button
                        size={'sm'}
                        onClick={() => saveInteraction(interactionKey)}
                    >
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

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
                />
            )}
        </div>
    );
}
