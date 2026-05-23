import { apiModelsToEntities, ReactFlowERD } from '@renderer/features/data-models'
import useStudioAPI from '@renderer/hooks/use-studio-api'
import { useMemo } from 'react'

export default function ERDLayout({ currentItem }: { currentItem: any }): React.ReactNode {
    const { models } = useStudioAPI(currentItem?.module)

    const entities = useMemo(
        () => apiModelsToEntities(Array.isArray(models) ? models : []),
        [models]
    )

    // Explicit height — react-flow has no intrinsic size and the API
    // generator's parent layout doesn't constrain it. Match the previous
    // gojs canvas's `100vh`.
    return (
        <div style={{ width: '100%', height: '100vh' }}>
            <ReactFlowERD entities={entities} readOnly />
        </div>
    )
}
