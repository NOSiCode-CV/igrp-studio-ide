import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system';

export const LabelRequired = ({ children }: { children: React.ReactNode }) => {
    return (
        <IGRPLabelPrimitive>
            {children}
            <span className="text-red-500"> *</span>
        </IGRPLabelPrimitive>
    );
};
