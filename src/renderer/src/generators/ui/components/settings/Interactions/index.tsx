import type { IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system'
import type { RuleDefinition } from '@igrp/igrp-studio-nextjs-engine/types'
import { EmptyList } from '@renderer/components/empty-list'
import useStudio from '@renderer/hooks/use-studio'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { MousePointer } from 'lucide-react'
import { useEffect, useState } from 'react'
import Rules from './components/rules'
import { type Action, TriggerControls } from './components/trigger-controls'

interface InteractionProps {
    comp: StructuredComponent
    path: string
    isRootComponent?: boolean
    pageName?: string
    onInteranctionsChange: (componentId: string, updates: Partial<StructuredComponent>) => void
    columnsOptions?: (IGRPOptionsProps & { type?: 'pageParam' | 'column' })[]
}

const Interactions = ({
    comp,
    path,
    isRootComponent = false,
    pageName,
    onInteranctionsChange,
    columnsOptions = []
}: InteractionProps) => {
    const { getInteractionsComponent } = useStudio()

    const [interactionsType, setInteractionsType] = useState({})

    const { componentName, interactions, id: componentId, tag, rules } = comp

    useEffect(() => {
        if (componentName) {
            getInteractionsComponent(path, componentName).then((data) => setInteractionsType(data))
        }
    }, [getInteractionsComponent, componentName, path])

    const handleInteractionsChange = (data: Record<string, Action>) => {
        if (componentId)
            onInteranctionsChange(componentId, {
                interactions: { ...data }
            })
    }

    const handleRulesChange = (data: RuleDefinition[]) => {
        if (!componentId) return
        onInteranctionsChange(componentId, {
            rules: data.length > 0 ? data : undefined
        })
    }

    return (
        <div className="p-3 space-y-2">
            <TriggerControls
                interactions={interactions}
                onInteractionsChange={handleInteractionsChange}
                interactionsType={interactionsType}
                componentTag={tag}
                columnsOptions={columnsOptions}
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
                rules={rules}
                isRootComponent={isRootComponent}
                ruleContext={comp}
                pageName={pageName}
                onRulesChange={handleRulesChange}
            />
        </div>
    )
}

export default Interactions
