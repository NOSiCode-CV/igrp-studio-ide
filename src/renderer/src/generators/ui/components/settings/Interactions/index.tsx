import { EmptyList } from '@renderer/components/empty-list';
import useStudio from '@renderer/hooks/use-studio';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { MousePointer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Action, TriggerControls } from './components/trigger-controls';
import Rules from './components/rules';
import { RuleDefinition } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';

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
    const { getInteractionsComponent, getRulesComponent } = useStudio();

    const [interactionsType, setInteractionsType] = useState({});

    const [rulesProperties, setRulesProperties] = useState({});

    const { componentName, interactions, id: componentId, tag, rules } = comp;

    useEffect(() => {
        if (componentName) {
            getInteractionsComponent(path, componentName).then((data) =>
                setInteractionsType(data)
            );
            getRulesComponent(path, componentName).then((data) =>
                setRulesProperties(data)
            );
        }
    }, [getInteractionsComponent, comp, componentName, path, getRulesComponent]);

    const handleInteractionsChange = (data: Record<string, Action>) => {
        if (componentId)
            onInteranctionsChange(componentId, {
                interactions: { ...data },
            });
    };

    const handleRulesChange = (data: RuleDefinition[]) => {
        if (componentId)
            onInteranctionsChange(componentId, {
                rules: data,
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
            {Object.keys(interactions || {}).length === 0 && (
                <EmptyList
                    title="Element Trigger"
                    description="Select an element on the canvas, then click + above to animate the selected element when a user interacts with it (such as on hover or click)."
                    className="py-12"
                    icon={<MousePointer />}
                />
            )}
            <Rules
                rulesProperties={rulesProperties}
                rules={rules}
                componentTag={tag}
                onRulesChange={handleRulesChange}
            />
        </div>
    );
};

export default Interactions;
