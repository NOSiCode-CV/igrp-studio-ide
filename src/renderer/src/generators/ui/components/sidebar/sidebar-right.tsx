import * as React from 'react';
import { Settings, X } from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
} from '@renderer/components/ui/sidebar';
import { Button } from '@renderer/components/ui/button';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { useTranslation } from 'react-i18next';
import RenderPropsConfig from '../settings/properties';
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
import useStudio from '@renderer/hooks/use-studio';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { EmptyList } from '@renderer/components/empty-list';
import Interactions from '../settings/Interactions';
import { StyleTab } from '../settings/style';
import { Label } from '@renderer/components/ui/label';
import { Input } from '@renderer/components/ui/input';
import useCustomCode from '../../hooks/useCustomCode';
import { State } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system';

interface SidebarRightProps extends React.ComponentProps<typeof Sidebar> {
    comp?: StructuredComponent;
    parentComp?: StructuredComponent;
    path?: string;
}

export function SidebarRight({
    comp,
    path,
    parentComp,
    ...props
}: SidebarRightProps) {
    const { t } = useTranslation();
    const { getPropertiesComponent, getChildPropertiesComponent, pageOptions } =
        useStudio();
    const {
        currentComponent: editingComponentParams,
        handleUpdateChildComponent,
        clearEditingComponent,
    } = useDroppedComponents();

    const { statesOptions } = useCustomCode();

    // Memoized derived state
    const currentComp = React.useMemo(
        () => comp || editingComponentParams?.component,
        [comp, editingComponentParams]
    );
    const currentPath = path || editingComponentParams?.path || '';
    const {
        label,
        tag,
        componentName,
        id: componentId,
        properties = {},
        childProperties = {},
        data,
    } = currentComp || {};

    // State management
    const [formValues, setFormValues] = React.useState<Record<string, any>>({});
    const [propsComponent, setPropsComponent] = React.useState<
        Record<string, any>
    >({});

    const [childformValues, setChildformValues] = React.useState<
        Record<string, any>
    >({});

    const [propsComponentChild, setPropsComponentChild] = React.useState<
        Record<string, any>
    >({});

    const [currentTag, setCurrentTag] = React.useState<string>(tag || '');

    const [columnsOptions, setColumnsOptions] = React.useState<
        IGRPOptionsProps[]
    >([]);

    React.useEffect(() => {
        setCurrentTag(tag || '');
    }, [tag]);

    React.useEffect(() => {
        const options =
            parentComp?.children
                .filter(
                    (column) =>
                        column?.properties?.dataProperties &&
                        !column.properties.dataProperties.isVirtual &&
                        column.properties.dataProperties.isType
                )
                .map((column) => {
                    return {
                        value: column.tag,
                        label: column.properties.headerTitle,
                    };
                }) ?? [];
        setColumnsOptions(options);
    }, [parentComp]);

    // Load properties component
    React.useEffect(() => {
        if (!componentName) return;

        const loadProps = async () => {
            try {
                const data = await getPropertiesComponent(
                    currentPath,
                    componentName
                );
                setPropsComponent(data);

                // Função para fazer deep merge de objetos
                const deepMerge = (target: any, source: any) => {
                    for (const key in source) {
                        if (source[key] instanceof Object && key in target) {
                            Object.assign(
                                source[key],
                                deepMerge(target[key], source[key])
                            );
                        }
                    }
                    Object.assign(target || {}, source);
                    return target;
                };

                // Initialize form values with deep merge
                const initialValues = deepMerge(
                    // Começa com os defaults
                    Object.entries(data ?? {}).reduce(
                        (acc, [key, config]) => {
                            acc[key] = config.default;
                            return acc;
                        },
                        {} as Record<string, any>
                    ),

                    // Sobrescreve com as properties atuais
                    properties
                );

                setFormValues(initialValues);
            } catch (error) {
                console.error('Error loading properties component:', error);
            }
        };

        loadProps();
    }, [componentId]);

    // Load properties component
    React.useEffect(() => {
        if (!componentName) return;

        const loadProps = async () => {
            try {
                const data = await getChildPropertiesComponent(
                    currentPath,
                    componentName
                );
                setPropsComponentChild(
                    data && !Array.isArray(data) ? data : {}
                );

                // Initialize form values
                const initialValues = Object.entries(data ?? {}).reduce(
                    (acc, [key, config]) => {
                        acc[key] = childProperties[key] ?? config.default;
                        return acc;
                    },
                    {} as Record<string, any>
                );

                setChildformValues(initialValues);
            } catch (error) {
                console.error('Error loading properties component:', error);
            }
        };

        loadProps();
    }, [componentId]);

    // Debounced component update
    React.useEffect(() => {
        if (!componentId) return;
        handleUpdateChildComponent(componentId, {
            ...currentComp,
            properties: { ...properties, ...formValues },
            childProperties: { ...childProperties, ...childformValues },
        });
    }, [formValues, childformValues]);

    // Event handlers
    const handleInputChange = React.useCallback(
        (
            fieldPath: string,
            value: any,
            setState: (states: Record<string, any>) => void
        ) => {
            setState((prev) => {
                const setNestedValue = (
                    obj: any,
                    path: string[],
                    val: any
                ): any => {
                    const [first, ...rest] = path;

                    if (rest.length === 0) {
                        return { ...obj, [first]: val };
                    }

                    return {
                        ...obj,
                        [first]: setNestedValue(obj[first] || {}, rest, val),
                    };
                };

                return setNestedValue(prev, fieldPath.split('.'), value);
            });
        },
        []
    );

    const handleClose = React.useCallback(() => {
        clearEditingComponent();
    }, [clearEditingComponent]);

    const udpateTag = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!componentId) return;
        handleUpdateChildComponent(componentId, {
            ...currentComp,
            properties: { ...properties, ...formValues },
            childProperties: { ...childProperties, ...childformValues },
            tag: e.target.value,
        });

        setCurrentTag(e.target.value);
    };

    const udpateDataProperties = ({
        field,
        state,
    }: {
        field: string;
        state: State | undefined;
    }) => {
        if (!componentId) return;

        const updatedData = { ...data };

        if (state) {
            updatedData[field] = {
                state: state,
            };
        } else {
            delete updatedData[field];
        }

        handleUpdateChildComponent(componentId, {
            ...currentComp,
            data: updatedData,
        });
    };

    return (
        <Sidebar
            collapsible="none"
            className="overflow-hidden *:data-[sidebar=sidebar]:flex-row top-(--header-height-two)! h-[calc(100svh-var(--header-height-three))]!"
            {...props}
            style={
                {
                    '--sidebar-width': '380px',
                } as React.CSSProperties
            }
        >
            <SidebarHeader>
                <div className="items-center justify-between flex flex-1">
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium leading-none">
                            {t('settings')}
                        </h4>

                        {componentName && (
                            <p className="text-sm text-muted-foreground"></p>
                        )}
                    </div>
                    {!comp && (
                        <Button variant={'ghost'} onClick={handleClose}>
                            <X />
                        </Button>
                    )}
                </div>
            </SidebarHeader>
            <SidebarContent>
                {!currentComp ? (
                    <div className="p-4">
                        <EmptyList
                            icon={<Settings />}
                            title="Settings Components"
                            description="Select a component on the table to start edit"
                        />
                    </div>
                ) : (
                    <>
                        <div className="space-y-2 p-2">
                            <Label htmlFor={'tab'}>
                                {`${label} - ${componentId}`}
                            </Label>
                            <Input
                                id="tag"
                                value={currentTag}
                                onChange={udpateTag}
                            />
                        </div>
                        <Tabs className="flex-1 px-2" defaultValue="props">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="props">Props</TabsTrigger>
                                <TabsTrigger value="styles">Style</TabsTrigger>
                                <TabsTrigger value="interactions">
                                    Interactions
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="props" className="space-y-6">
                                <Accordion
                                    type="single"
                                    collapsible
                                    className="w-full"
                                    defaultValue="item-1"
                                >
                                    <AccordionItem value="item-1">
                                        <AccordionTrigger>
                                            {t('properties')}
                                        </AccordionTrigger>
                                        <AccordionContent className="space-y-2">
                                            {propsComponent && (
                                                <RenderPropsConfig
                                                    propsComp={propsComponent}
                                                    formValues={formValues}
                                                    pageOptions={pageOptions}
                                                    dataProperties={data}
                                                    statesOptions={
                                                        statesOptions
                                                    }
                                                    columnsOptions={
                                                        columnsOptions
                                                    }
                                                    tag={currentTag}
                                                    onInputChange={(
                                                        fieldPath: string,
                                                        value: any
                                                    ) => {
                                                        handleInputChange(
                                                            fieldPath,
                                                            value,
                                                            setFormValues
                                                        );
                                                    }}
                                                    onSelectState={(
                                                        field: string,
                                                        state: State | undefined
                                                    ) =>
                                                        udpateDataProperties({
                                                            field,
                                                            state,
                                                        })
                                                    }
                                                />
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                    {Object.keys(propsComponentChild).length >
                                        0 && (
                                        <AccordionItem value="item-1">
                                            <AccordionTrigger>
                                                {t('Child Properties')}
                                            </AccordionTrigger>
                                            <AccordionContent className="space-y-2">
                                                <RenderPropsConfig
                                                    propsComp={
                                                        propsComponentChild
                                                    }
                                                    formValues={childformValues}
                                                    pageOptions={pageOptions}
                                                    dataProperties={data}
                                                    statesOptions={
                                                        statesOptions
                                                    }
                                                    columnsOptions={
                                                        columnsOptions
                                                    }
                                                    tag={currentTag}
                                                    onInputChange={(
                                                        fieldPath: string,
                                                        value: any
                                                    ) =>
                                                        handleInputChange(
                                                            fieldPath,
                                                            value,
                                                            setChildformValues
                                                        )
                                                    }
                                                    onSelectState={(
                                                        field: string,
                                                        state: State | undefined
                                                    ) =>
                                                        udpateDataProperties({
                                                            field,
                                                            state,
                                                        })
                                                    }
                                                />
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}
                                </Accordion>
                            </TabsContent>
                            <TabsContent value="styles" className="space-y-6">
                                <StyleTab
                                    comp={currentComp}
                                    path={currentPath}
                                    onInteranctionsChange={
                                        handleUpdateChildComponent
                                    }
                                />
                            </TabsContent>
                            <TabsContent
                                value="interactions"
                                className="space-y-6"
                            >
                                <Interactions
                                    comp={currentComp}
                                    path={currentPath}
                                    onInteranctionsChange={
                                        handleUpdateChildComponent
                                    }
                                />
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </SidebarContent>
        </Sidebar>
    );
}
