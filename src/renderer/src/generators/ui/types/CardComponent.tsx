import { StructuredComponent } from '@renderer/lib/dnd/types';
import {  COMPONENT_MAP, ICON_MAP } from '../ComponentTypes';

export interface CardComponentProps {
    comp: StructuredComponent;
}

const CardComponent = ({ comp }: CardComponentProps) => {
    const { componentName, properties } = comp;

    const { commonProperties, iconProperties, error, errorMessage, ...args } = properties;

    const Icon = ICON_MAP[componentName];

    const Component = COMPONENT_MAP[componentName];

    return (
        <>
            {Component ? (
                //@ts-ignore
                <Component {...args} />
            ) : (
                <div className="rounded-lg shadow-xs border p-4 bg-card">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-blue-600" />
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
