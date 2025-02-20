import { Textarea } from '@renderer/components/ui/Textarea';
import { useState } from 'react';

export const CustomStyle = () => {
    const [properties, setProperties] = useState();

    return (
        <>
            <div className="space-y-2">
                <Textarea placeholder="Enter your custom style..." />
            </div>
        </>
    );
};
