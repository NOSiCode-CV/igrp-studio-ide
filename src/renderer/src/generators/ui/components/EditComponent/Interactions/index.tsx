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
    const [interactionsType, setInteractionsType] = useState({});

    const [linkedShadow, setLinkedShadow] = useState(true);
    const [interactions, setInteractions] = useState<ShadowValue[]>([]);

    const { componentName } = comp;

    useEffect(() => {
        if (componentName)
            getInteractionsComponent(path, componentName).then((data) =>
                setInteractionsType(data)
            );
    }, [getInteractionsComponent, comp, componentName]);

    return (
        <div className="p-3 space-y-2">
            <TriggerControls
                shadows={interactions}
                linkedShadow={linkedShadow}
                onShadowsChange={setInteractions}
                onLinkedShadowChange={setLinkedShadow}
                interactions={interactionsType}
            />
            {interactions.length === 0 && (
                <EmptyList
                    title="Element Trigger"
                    description="Select an element on the canvas, then click + above to animate the selected element when a user interacts with it (such as on hover or click)."
                    className="py-12"
                    icon={<MousePointer />}
                />
            )}
        </div>
    );
};

export default Interactions;
