import * as React from 'react';
import { MousePointer, Settings, X } from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
} from '@renderer/components/ui/sidebar';
import { Button } from '@renderer/components/ui/button';
import { useDroppedComponents } from '../dnd/DroppedComponentsContext';
import { useTranslation } from 'react-i18next';
import RenderPropsConfig from './EditComponent/RenderPropsConfig';
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
import { TextPropertiesPanel } from './EditComponent/text-properties';
import useStudio from '@renderer/hooks/useStudio';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { EmptyList } from '@renderer/components/empty-list';

interface SidebarRightProps extends React.ComponentProps<typeof Sidebar> {
    comp?: StructuredComponent;
}

export function SidebarRight({ ...props }: SidebarRightProps) {
    const { comp } = props;

    const { t } = useTranslation();
    const [formValues, setFormValues] = React.useState({});

    const { getPropertiesComponent } = useStudio();

    const [propsComponent, setPropsComponents] = React.useState({});

    const {
        currentComponent,
        handleUpdateChildComponent,
        clearEditingComponent,
    } = useDroppedComponents();

    const {
        componentName,
        id: componentId,
        properties,
    } = comp || currentComponent?.component || {};

    const { componentName: parentComponentName } =
        comp || currentComponent?.parentComp || {};

    React.useEffect(() => {
        if (componentName)
            getPropertiesComponent(parentComponentName, componentName).then(
                (data) => setPropsComponents(data)
            );
    }, [getPropertiesComponent, componentName]);

    const handleInputChange = (name: string, value: string) => {
        setFormValues((prevValues) => ({
            ...prevValues,
            [name]: value,
        }));
    };

    const handleClose = () => {
        clearEditingComponent();
    };

/*     const handleChange = (changes: any) => {
        Object.entries(changes).forEach(([key, value]) => {
            setFormValues((prevValues) => ({
                ...prevValues,
                [key]: value,
            }));
        });
    }; */

    React.useEffect(() => {
        if (propsComponent) {
            const initialFormValues = Object.keys(propsComponent).reduce(
                (acc, key) => {
                    acc[key] =
                        properties?.[key] ??
                        propsComponent[key].defaultValue ??
                        '';
                    return acc;
                },
                {}
            );

            setFormValues(initialFormValues);
        }
    }, [propsComponent, properties, componentName]);

    React.useEffect(() => {
        const updatedConfig = { ...properties, ...formValues };

        const updatedComponent: Partial<StructuredComponent> = {
            ...currentComponent,
            properties: updatedConfig,
        };

        if (componentId)
            handleUpdateChildComponent(componentId, updatedComponent);
    }, [formValues]);

    return (
        <Sidebar
            collapsible="none"
            className="overflow-hidden *:data-[sidebar=sidebar]:flex-row top-(--header-height-two)! h-[calc(100svh-var(--header-height-two))]!"
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
                    <>
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
                                <Accordion
                                    type="single"
                                    collapsible
                                    className="w-full"
                                    defaultValue="item-1"
                                >
                                    <AccordionItem
                                        value="item-1"
                                        className="px-3"
                                    >
                                        <AccordionTrigger>
                                            {t('textProperties')}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <TextPropertiesPanel />
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </TabsContent>
                            <TabsContent
                                value="interactions"
                                className="space-y-6"
                            >
                                <div className="p-3">
                                    <EmptyList
                                        title="Element Trigger"
                                        description="Select an element on the canvas, then click + above to animate the selected element when a user interacts with it (such as on hover or click)."
                                        className="py-12"
                                        icon={<MousePointer />}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </SidebarContent>
        </Sidebar>
    );
}
