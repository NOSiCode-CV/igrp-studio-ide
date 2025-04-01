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
import RenderPropsConfig from '../EditComponent/properties';
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
import Interactions from '../EditComponent/Interactions';
import { StyleTab } from '../EditComponent/style';

interface SidebarRightProps extends React.ComponentProps<typeof Sidebar> {
    comp?: StructuredComponent;
    path?: string;
}

export function SidebarRight({ comp, path, ...props }: SidebarRightProps) {
    const { t } = useTranslation();
    const { getPropertiesComponent } = useStudio();
    const {
        currentComponent: editingComponentParams,
        handleUpdateChildComponent,
        clearEditingComponent,
    } = useDroppedComponents();

    // Memoized derived state
    const currentComp = React.useMemo(
        () => comp || editingComponentParams?.component,
        [comp, editingComponentParams]
    );
    const currentPath = path || editingComponentParams?.path || '';
    const {
        componentName,
        id: componentId,
        properties = {},
    } = currentComp || {};

    // State management
    const [formValues, setFormValues] = React.useState<Record<string, any>>({});
    const [propsComponent, setPropsComponent] = React.useState<
        Record<string, any>
    >({});

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

                // Initialize form values
                const initialValues = Object.entries(data).reduce(
                    (acc, [key, config]) => {
                        acc[key] = properties[key] ?? config.defaultValue;
                        return acc;
                    },
                    {} as Record<string, any>
                );

                setFormValues(initialValues);
            } catch (error) {
                console.error('Error loading properties component:', error);
            }
        };

        loadProps();
    }, [componentId, currentPath, getPropertiesComponent, properties]);

    // Debounced component update
    React.useEffect(() => {
        if (!componentId || Object.keys(formValues).length === 0) return;

        const timer = setTimeout(() => {
            handleUpdateChildComponent(componentId, {
                ...currentComp,
                properties: { ...properties, ...formValues },
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [
        formValues,
        componentId,
        currentComp,
        handleUpdateChildComponent,
        properties,
    ]);

    // Event handlers
    const handleInputChange = React.useCallback(
        (name: string, value: string) => {
            setFormValues((prev) => ({ ...prev, [name]: value }));
        },
        []
    );

    const handleClose = React.useCallback(() => {
        clearEditingComponent();
    }, [clearEditingComponent]);

    return (
        <Sidebar
            collapsible="none"
            className="overflow-hidden *:data-[sidebar=sidebar]:flex-row top-(--header-height-two)! h-[calc(100svh-var(--header-height-three))]!"
            {...props}
        >
            <SidebarHeader className="h-16 border-b border-sidebar-border">
                <div className="items-center justify-between flex flex-1">
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium leading-none">
                            {t('settings')}
                        </h4>

                        {componentName && (
                            <p className="text-sm text-muted-foreground">
                                {`${componentName} - ${componentId}`}
                            </p>
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
                {!componentName ? (
                    <div className="p-4">
                        <EmptyList
                            icon={<Settings />}
                            title="Settings Components"
                            description="Select a component on the table to start edit"
                        />
                    </div>
                ) : (
                    <Tabs className="flex-1" defaultValue="props">
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
                                    <AccordionTrigger className="px-2">
                                        {t('properties')}
                                    </AccordionTrigger>
                                    <AccordionContent className="px-2">
                                        {propsComponent && (
                                            <RenderPropsConfig
                                                propsComp={propsComponent}
                                                formValues={formValues}
                                                handleInputChange={
                                                    handleInputChange
                                                }
                                            />
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </TabsContent>
                        <TabsContent value="styles" className="space-y-6">
                            <StyleTab />
                        </TabsContent>
                        <TabsContent value="interactions" className="space-y-6">
                            {currentComp && (
                                <Interactions
                                    comp={currentComp}
                                    path={currentPath}
                                />
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </SidebarContent>
        </Sidebar>
    );
}
