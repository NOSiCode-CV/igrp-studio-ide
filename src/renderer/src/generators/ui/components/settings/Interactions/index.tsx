import { EmptyList } from '@renderer/components/empty-list';
import useStudio from '@renderer/hooks/use-studio';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { MousePointer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TriggerControls } from './components/trigger-controls';
import { InteractionValue } from '../style/components/effects/types';

interface InteractionProps {
    comp: StructuredComponent;
    path: string;
    onInteranctionsChange: (
        componentId: string,
        updates: Partial<StructuredComponent>
    ) => void;
}

const Interactions = ({
    comp,
    path,
    onInteranctionsChange,
}: InteractionProps) => {
    const { getInteractionsComponent } = useStudio();

    const [interactionsType, setInteractionsType] = useState({});

    const { componentName, interactions, id: componentId, tag } = comp;

    useEffect(() => {
        if (componentName)
            getInteractionsComponent(path, componentName).then((data) =>
                setInteractionsType(data)
            );
    }, [getInteractionsComponent, comp, componentName]);

    const handleInteractionsChange = (
        data: Record<string, InteractionValue>
    ) => {
        if (componentId)
            onInteranctionsChange(componentId, {
                ...comp,
                interactions: { ...data },
            });
    };

    return (
        <div className="p-3 space-y-2">
            <TriggerControls
                interactions={interactions}
                onInteractionsChange={handleInteractionsChange}
                interactionsType={interactionsType}
                componentTag={tag}
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
