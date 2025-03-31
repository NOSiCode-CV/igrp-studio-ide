import useStudio from '@renderer/hooks/use-studio';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { useEffect, useState } from 'react';

export const ComponentRenderer = ({ comp, onDragEnd }) => {
    const { componentName } = comp;

    const [components, setComponents] = useState<StructuredComponent[]>([]);

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const { dynamicImport, getComponentData, basePath } = useStudio();

    useEffect(() => {
        const getJsonData = async () => {
            try {
                const data = await getComponentData(componentName);
                setComponents(data.components?.children || []);
            } catch (error) {
                console.error('Failed to load JSON content:', error);
            }
        };
        getJsonData();
    }, [basePath, componentName]);

    useEffect(() => {
        const loadComponents = async () => {
            const comps: { [key: string]: React.ComponentType<any> } = {};

            for (const comp of components) {
                const component = await dynamicImport(comp.componentName);
                comps[comp.id] = component;
            }

            setLoadedComponents(comps);
        };

        loadComponents();
    }, [components, dynamicImport]);
    return (
        <div className="pointer-events-none hover:border-red-500">
            {components.length > 0 ? (
                components.map(
                    (component: StructuredComponent, index: number) => {
                        const Component = loadedComponents[component.id];
                        return Component ? (
                            <Component
                                key={index}
                                comp={component}
                                onDragEnd={onDragEnd}
                                isDisabled={true}
                            />
                        ) : (
                            <div key={component.id}>Loading...</div>
                        );
                    }
                )
            ) : (
                <div>No components to render</div>
            )}
        </div>
    );
};
