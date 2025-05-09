import { Plus, Trash2, Edit2, Save, Mouse } from 'lucide-react';
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
    DialogTrigger,
} from '@renderer/components/ui/dialog';
import { useEffect, useRef, useState } from 'react';

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

    const codeRef = useRef<string>('');

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
        try {
            updateInteraction(key, 'fnCustomSet', codeRef.current);
        } catch (e: any) {
            console.error(e);
        }
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
    }: {
        interaction: InteractionValue;
        interactionKey: string;
    }) => (
        <Dialog>
            <DialogTrigger asChild>
                <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    <Edit2 size={10} />
                </button>
            </DialogTrigger>
            <DialogContent className="flex flex-col overflow-hidden [--header-height-three:calc(--spacing(75))] sm:max-w-[800px] lg:max-w-[900px] max-w-7xl h-[70vh]">
                <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Edit Interaction {interactionKey + 1}
                        </span>
                        <div>
                            <button
                                onClick={() => saveInteraction(interactionKey)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                                <Save size={16} />
                            </button>
                            <button
                                onClick={() =>
                                    removeInteraction(interactionKey)
                                }
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    <MonacoEditor
                        content={interaction.fnCustomSet}
                        filePath=""
                        onChange={(newCode) => {
                            codeRef.current = newCode;
                        }}
                        height="20vh"
                        language="typescript"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );

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
                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        {interactionsType[key]?.label || key}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="relative">
                                        <InteractionEditor
                                            interaction={interaction}
                                            interactionKey={key}
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeInteraction(key)}
                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            </div>
                        );
                    }
                )}
            </div>
        </div>
    );
}
