import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
} from '@renderer/components/ui/sidebar';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
import { useEffect, useState } from 'react';
import {
    Argument,
    Import,
} from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import {
    CheckboxInput,
    SelectInput,
    TextInput,
} from '@renderer/generators/api/components/inputs-form';
import { useTranslation } from 'react-i18next';
import { Label } from '@renderer/components/ui/label';
import { Separator } from '@renderer/components/ui/separator';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@renderer/components/ui/accordion';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import useCustomCode from '../../../hooks/useCustomCode';
import { TabsFunctions, TabSnipptes, TabStates } from './custom-code-tabs';
import { cn } from '@renderer/lib/utils';

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
    componentTag: string
    editorRef?: React.RefObject<any>;
    onInsertImport?: (importObj: Import) => void;
}

export const FunctionSettingsSidebar = ({
    formik,
    editorRef,
    componentTag,
    onInsertImport,
    ...props
}: FunctionSettingsSidebarProps) => {
    const { t } = useTranslation();

    const { states, snippets, functions } = useCustomCode();

    const [arguments_, setArguments] = useState<Argument[]>(
        formik ? formik.values.arguments : []
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
        if (formik) formik.setFieldValue('arguments', arguments_);
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
                <Tabs defaultValue={formik ? 'props' : 'states'}>
                    <TabsList
                        className={cn(
                            'grid w-full grid-cols-4',
                            !formik ? 'grid-cols-3' : ''
                        )}
                    >
                        {formik && (
                            <TabsTrigger value="props">Props</TabsTrigger>
                        )}
                        <TabsTrigger value="states">States</TabsTrigger>
                        <TabsTrigger value="functions">Functions</TabsTrigger>
                        <TabsTrigger value="snippets">Snippets</TabsTrigger>
                    </TabsList>
                    {formik && (
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
                                                formik.values.returnValue
                                                    ?.isList
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
                                                            removeArgument(
                                                                arg.id
                                                            );
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
                                <Button
                                    onClick={addArgument}
                                    className="w-full"
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add
                                    Arguments
                                </Button>
                            </div>
                        </TabsContent>
                    )}
                    <TabsContent value="states" className="space-y-4">
                        <TabStates states={states} editorRef={editorRef} />
                    </TabsContent>
                    <TabsContent value="snippets" className="space-y-4">
                        <TabSnipptes
                            snippets={snippets}
                            editorRef={editorRef}
                            componentTag={componentTag}
                        />
                    </TabsContent>
                    <TabsContent value="functions" className="space-y-4">
                        <TabsFunctions
                            functions={functions}
                            editorRef={editorRef}
                            currentFunction={formik?.values}
                            onInsertImport={onInsertImport}
                        />
                    </TabsContent>
                </Tabs>
            </SidebarContent>
        </Sidebar>
    );
};
