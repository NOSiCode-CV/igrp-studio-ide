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
    componentId
}) => {

    return (
        <div className="p-4 border rounded-lg shadow bg-white">
            <h3 className="text-lg font-bold">{componentName}</h3>
            <p className="text-sm text-gray-600">Component ID: {componentId}</p>
        </div>
    );
};

export default AppCompLayout;
