import React from 'react';
import { DroppedComponent } from '../../../interfaces';

export interface FormComponentProps {
    componentName: string;
    componentId: string;
    acceptTypes: string[];
    comp: DroppedComponent;
    onEdit: () => void;
}

const AppCompLayout: React.FC<FormComponentProps> = ({
    componentName,
    componentId,
    onEdit,
}) => {

    return (
        <div className="p-4 border rounded-lg shadow">
            <h3 className="text-lg font-bold">{componentName}</h3>
            <p className="text-sm text-gray-600">Component ID: {componentId}</p>
            <button
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
                onClick={onEdit}
            >
                Edit
            </button>
        </div>
    );
};

export default AppCompLayout;
