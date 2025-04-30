import { StructuredComponent } from '@renderer/lib/dnd/types';
import { COMPONENT, COMPONENT_MAP, ICON_MAP } from '../ComponentTypes';
import { getFakeComponentData } from '../fakeComponentData';

export interface CardComponentProps {
    comp: StructuredComponent;
}

const CardComponent = ({ comp }: CardComponentProps) => {
    const { componentName, properties } = comp;

    const { commonProperties, iconProperties, error, errorMessage, ...args } =
        properties;

    const componentLabel = commonProperties?.label || componentName;

    const Icon = ICON_MAP[componentName];

    const Component = COMPONENT_MAP[componentName];

    const FAKE_COMPONENT_DATA = getFakeComponentData(componentName);

    return (
        <>
            {Component ? (
                componentName === COMPONENT.Button ? (
                    //@ts-ignore
                    <Component {...args} onSelectValueChange={() => void 0}>
                        {componentLabel}
                    </Component>
                ) : (
                    //@ts-ignore
                    <Component
                        {...args}
                        {...FAKE_COMPONENT_DATA?.properties}
                        onSelectValueChange={() => void 0}
                    ></Component>
                )
            ) : (
                <div className="rounded-lg shadow-xs border p-4 bg-card">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="w-10 h-10 rounded-lg bg-igrp/20 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-igrp" />
                            </div>
                        )}
                        <div className="text-sm font-medium text-gray-700">
                            {componentName}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CardComponent;
