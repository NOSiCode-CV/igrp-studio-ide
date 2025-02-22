import { ICON_MAP } from '../data/ComponentRegistry';
import { DroppedComponent } from '../interfaces';

export interface CardComponentProps {
    componentName: string;
}

const CardComponent = ({ componentName }: DroppedComponent) => {
    const Icon = ICON_MAP[componentName];

    return (
        <div className="rounded-lg shadow-xs border border-gray-200 p-4">
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
    );
};

export default CardComponent; // Export the component
