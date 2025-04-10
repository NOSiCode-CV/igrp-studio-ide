import { EmptyList } from '@renderer/components/empty-list';
import useStudio from '@renderer/hooks/use-studio';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { MousePointer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TriggerControls } from './components/TriggerControls';
import { ShadowValue } from '../style/components/effects/types';

const Interactions = ({
    comp,
    path,
}: {
    comp: StructuredComponent;
    path: string;
}) => {
    const { getInteractionsComponent } = useStudio();
    const [interactions, setInteractions] = useState({});

    const [linkedShadow, setLinkedShadow] = useState(true);
    const [boxShadows, setBoxShadows] = useState<ShadowValue[]>([
        {
            x: '0',
            y: '4',
            blur: '8',
            spread: '0',
            color: '#00000040',
            inset: false,
        },
    ]);

    const { componentName, id: componentId, properties } = comp;

    useEffect(() => {
        if (componentName)
            getInteractionsComponent(path, componentName).then((data) =>
                setInteractions(data)
            );
    }, [getInteractionsComponent, comp, componentName]);

    console.log(interactions);

    return (
        <div className="p-3 space-y-2">
            <TriggerControls
                shadows={boxShadows}
                linkedShadow={linkedShadow}
                onShadowsChange={setBoxShadows}
                onLinkedShadowChange={setLinkedShadow}
                interactions={interactions}
            />

            <EmptyList
                title="Element Trigger"
                description="Select an element on the canvas, then click + above to animate the selected element when a user interacts with it (such as on hover or click)."
                className="py-12"
                icon={<MousePointer />}
            />
        </div>
    );
};

export default Interactions;
