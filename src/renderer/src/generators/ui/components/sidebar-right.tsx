import * as React from 'react';
import { X } from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
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
import { CustomStyle } from './EditComponent/custom-style';
import { ButtonAppearancePanel } from './EditComponent/button-appearance';
import IconLibrary from '@renderer/components/icon-library';
import useStudio from '@renderer/hooks/useStudio';
import { StructuredComponent } from '@renderer/lib/dnd/types';

export function SidebarRight({
    ...props
}: React.ComponentProps<typeof Sidebar>) {
    const { t } = useTranslation();

    const { getConfigComponent } = useStudio();

    const [propsComponent, setPropsComponents] = React.useState({});

    const { currentComponent, updateComponent, clearEditingComponent } =
        useDroppedComponents();

    if (!currentComponent) {
        return null;
    }

    const { componentName, id: componentId, properties } = currentComponent;

    React.useEffect(() => {
        const loadComponents = async () => {
            const props = await getConfigComponent(componentName);
            setPropsComponents(props);
        };

        loadComponents();
    }, [componentName, getConfigComponent]);

    const initialFormValues =
        propsComponent &&
        Object.keys(props).reduce((acc, key) => {
            acc[key] = props[key].defaultValue ?? properties?.[key] ?? '';
            return acc;
        }, {});

    const [formValues, setFormValues] = React.useState(initialFormValues);

    const handleInputChange = (name: string, value: string) => {
        setFormValues((prevValues) => ({
            ...prevValues,
            [name]: value,
        }));
    };

    const handleChange = (changes: any) => {
        Object.entries(changes).forEach(([key, value]) => {
            setFormValues((prevValues) => ({
                ...prevValues,
                [key]: value,
            }));
        });
    };

    const handleClose = () => {
        clearEditingComponent();
    };

    React.useEffect(() => {
        const updatedConfig = { ...properties, ...formValues };

        const updatedComponent: StructuredComponent = {
            ...currentComponent,
            properties: updatedConfig,
        };

        if (componentId) {
            /*  const formComponent: StructuredComponent =
                getComponent(componentId) ?? {};

            updateComponent(componentId, {
                ...formComponent,
                fields: formComponent.fields.map((field) =>
                    field.id === componentId ? { ...field, ...updatedComponent } : field
                ),
            }); */
        } else if (componentId !== undefined)
            updateComponent(componentId, updatedComponent);
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
                        <p className="text-sm text-muted-foreground">
                            {`${componentName} - ${componentId}`}
                        </p>
                    </div>
                    <Button variant={'ghost'} onClick={handleClose}>
                        <X />
                    </Button>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <Tabs className="flex-1" defaultValue="props">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="props">Props</TabsTrigger>
                        <TabsTrigger value="styles">Style</TabsTrigger>
                    </TabsList>

                    <TabsContent value="props" className="space-y-6">
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                            defaultValue="item-1"
                        >
                            <AccordionItem value="item-1" className="px-3">
                                <AccordionTrigger>
                                    {t('properties')}
                                </AccordionTrigger>
                                <AccordionContent>
                                    {propsComponent && (
                                        <RenderPropsConfig
                                            propsConfig={propsComponent}
                                            formValues={formValues}
                                            handleInputChange={
                                                handleInputChange
                                            }
                                        />
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3" className="px-3">
                                <AccordionTrigger>
                                    {t('buttonAppearance')}
                                </AccordionTrigger>
                                <AccordionContent>
                                    <ButtonAppearancePanel
                                        onChange={handleChange}
                                    />
                                    <IconLibrary />
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
                            <AccordionItem value="item-1" className="px-3">
                                <AccordionTrigger>
                                    {t('textProperties')}
                                </AccordionTrigger>
                                <AccordionContent>
                                    <TextPropertiesPanel />
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2" className="px-3">
                                <AccordionTrigger>
                                    {t('customClasses')}
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CustomStyle />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </TabsContent>
                </Tabs>
            </SidebarContent>
            <SidebarFooter></SidebarFooter>
        </Sidebar>
    );
}
