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
import { DataValue, StructuredComponent } from '@renderer/lib/dnd/types';
import { EmptyList } from '@renderer/components/empty-list';
import Interactions from '../settings/Interactions';
import { StyleTab } from '../settings/style';
import { Label } from '@renderer/components/ui/label';
import { Input } from '@renderer/components/ui/input';
import useCustomCode from '../../hooks/useCustomCode';
import { State } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system';

import {
    ChangeEvent,
    ComponentProps,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

interface SidebarRightProps extends ComponentProps<typeof Sidebar> {
    comp?: StructuredComponent;
    parentComp?: StructuredComponent;
    path?: string;
}

const SidebarRight = ({
    comp,
    path,
    parentComp,
    ...props
}: SidebarRightProps) => {
    const { t } = useTranslation();
    const {
        getPropertiesComponent,
        getDataComponent,
        getChildPropertiesComponent,
        pageOptions,
    } = useStudio();
    const {
        currentComponent: editingComponentParams,
        handleUpdateChildComponent,
        clearEditingComponent,
    } = useDroppedComponents();

    const { statesOptions } = useCustomCode();
   
    // Memoized derived state
    const currentComp = useMemo(
        () => comp || editingComponentParams?.component,
        [comp, editingComponentParams]
    );

    const currentPath = path || editingComponentParams?.path || '';
    const {
        label,
        tag,
        data,
        componentName,
        properties = {},
        childProperties = {},
        id: componentId,
    } = currentComp || {};

    // State management
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [propsComponent, setPropsComponent] = useState<Record<string, any>>(
        {}
    );

    const [childformValues, setChildformValues] = useState<Record<string, any>>(
        {}
    );

    const [propsComponentChild, setPropsComponentChild] = useState<
        Record<string, any>
    >({});

    const [currentTag, setCurrentTag] = useState<string>(tag || '');

    const [columnsOptions, setColumnsOptions] = useState<IGRPOptionsProps[]>(
        []
    );

    useEffect(() => {
        if (!componentName) return;
        getDataComponent(currentPath, componentName).then((response) => {
            // Check if each key in data exists in response
            if (data && response) {
                const cleanedData = { ...data };
                let hasChanges = false;

                // Iterate through each key in the current data
                Object.keys(data).forEach((key) => {
                    // If the key doesn't exist in the response, remove it
                    if (!(key in response)) {
                        delete cleanedData[key];
                        hasChanges = true;
                    }
                });

                // Iterate through each key in the response
                Object.keys(response).forEach((key) => {
                    // If the key doesn't exist in the current data, add it
                    if (!(key in data)) {
                        cleanedData[key] = response[key];
                        hasChanges = true;
                    }
                });

                // If we made changes, update the component with cleaned data
                if (hasChanges && componentId) {
                    handleUpdateChildComponent(componentId, {
                        ...currentComp,
                        data: cleanedData,
                    });
                }
            }
        });
    }, [
        componentName,
        currentPath,
        data,
        componentId,
        currentComp,
        handleUpdateChildComponent,
        getDataComponent,
    ]);

    useEffect(() => {
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
    useEffect(() => {
        if (!componentName) return;

        setCurrentTag(tag || '');

        const loadProps = async () => {
            try {
                const data = await getPropertiesComponent(
                    currentPath,
                    componentName
                );
                setPropsComponent(data);

                // Função para fazer deep merge de objetos
                const deepMerge = (target: any, source: any) => {
                    const result = { ...target };

                    for (const key in source) {
                        if (
                            source[key] instanceof Object &&
                            key in target &&
                            target[key] instanceof Object
                        ) {
                            result[key] = deepMerge(target[key], source[key]);
                        } else {
                            // Always use source value if it exists
                            result[key] = source[key];
                        }
                    }

                    return result;
                };

                const target = // Aplica os valores padrão
                    Object.entries(data ?? {}).reduce(
                        (acc, [key, config]) => {
                            if (config.type === 'object' && config.properties) {
                                acc[key] = Object.entries(
                                    config.properties
                                ).reduce(
                                    (
                                        objAcc,
                                        [propKey, propConfig]: [string, any]
                                    ) => {
                                        if (
                                            propConfig.default !== undefined ||
                                            propConfig.required
                                        ) {
                                            objAcc[propKey] =
                                                propConfig.default;
                                        }
                                        return objAcc;
                                    },
                                    {}
                                );
                            } else if (config.default || config.required) {
                                acc[key] = config.default;
                            }
                            return acc;
                        },
                        {} as Record<string, any>
                    );

                const source = // Filter properties based on schema and requirements
                    Object.entries(properties ?? {}).reduce(
                        (acc, [key, value]) => {
                            const schemaConfig = data?.[key];

                            // Skip if property not in schema
                            if (!schemaConfig) {
                                return acc;
                            }

                            // Handle nested objects
                            if (
                                schemaConfig.type === 'object' &&
                                schemaConfig.properties
                            ) {
                                const filteredNestedProps = Object.entries(
                                    value || {}
                                ).reduce(
                                    (nestedAcc, [nestedKey, nestedValue]) => {
                                        const nestedConfig =
                                            schemaConfig.properties[nestedKey];
                                        // Keep if in schema and (required or not null)
                                        if (
                                            nestedConfig &&
                                            (nestedConfig.required ||
                                                nestedValue !== null)
                                        ) {
                                            nestedAcc[nestedKey] = nestedValue;
                                        }
                                        return nestedAcc;
                                    },
                                    {}
                                );

                                if (
                                    Object.keys(filteredNestedProps).length > 0
                                ) {
                                    acc[key] = filteredNestedProps;
                                }
                            }
                            // Handle non-object properties
                            else if (schemaConfig.required || value) {
                                // For string type, keep empty strings
                                acc[key] = value;
                            }

                            return acc;
                        },
                        {} as Record<string, any>
                    );

                // Initialize form values with deep merge
                const initialValues = deepMerge(target, source);

                setFormValues(initialValues);
            } catch (error) {
                console.error('Error loading properties component:', error);
            }
        };

        loadProps();
    }, [componentId, componentName, currentPath, properties, tag]);

    // Load properties component
    useEffect(() => {
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
                        if (config.default !== null || config.required) {
                            acc[key] = childProperties[key] ?? config.default;
                        }
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
    useEffect(() => {
        if (!componentId) return;
        handleUpdateChildComponent(componentId, {
            ...currentComp,
            properties: { ...formValues },
            childProperties: { ...childformValues },
        });
    }, [formValues, childformValues, currentComp]);

    // Event handlers
    const handleInputChange = useCallback(
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

    const handleClose = useCallback(() => {
        clearEditingComponent();
    }, [clearEditingComponent]);

    const udpateTag = (e: ChangeEvent<HTMLInputElement>) => {
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
        value,
    }: {
        field: string;
        state?: State;
        value?: DataValue;
    }) => {
        if (!componentId) return;

        const updatedData = { ...data };

        delete updatedData[field];

        if (state) {
            updatedData[field] = {
                state,
            };
        }

        if (value) {
            updatedData[field] = {
                value,
            };
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
                } as React.CSSProperties & { '--sidebar-width': string }
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
                                {`${label || componentName} - ${componentId}`}
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
                                                        value: string | boolean
                                                    ) => {
                                                        handleInputChange(
                                                            fieldPath,
                                                            value,
                                                            setFormValues
                                                        );
                                                    }}
                                                    onSelectState={(
                                                        field: string,
                                                        state:
                                                            | State
                                                            | undefined,
                                                        value:
                                                            | DataValue
                                                            | undefined
                                                    ) =>
                                                        udpateDataProperties({
                                                            field,
                                                            state,
                                                            value,
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
                                                        value: string | boolean
                                                    ) =>
                                                        handleInputChange(
                                                            fieldPath,
                                                            value,
                                                            setChildformValues
                                                        )
                                                    }
                                                    onSelectState={(
                                                        field: string,
                                                        state:
                                                            | State
                                                            | undefined,
                                                        value:
                                                            | DataValue
                                                            | undefined
                                                    ) =>
                                                        udpateDataProperties({
                                                            field,
                                                            state,
                                                            value,
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
};

export default SidebarRight;
