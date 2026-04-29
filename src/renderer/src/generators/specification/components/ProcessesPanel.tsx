import { Workflow } from 'lucide-react'
import type { JSX } from 'react'
import { ProcessEditor } from '../../../features/bpmn/components/ProcessEditor/ProcessEditor'
import { ProcessList } from '../../../features/bpmn/components/ProcessList'
import { useProcessesSelection } from '../../../features/bpmn/components/ProcessesSelection'

interface ProcessesPanelProps {
    basePath?: string
    currentItem?: any
    variant?: 'list' | 'content'
}

const ListVariant = (): JSX.Element => <ProcessList variant="panel" />

const ContentVariant = (): JSX.Element => {
    const { processId, setProcessId } = useProcessesSelection()

    if (!processId) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <Workflow className="h-10 w-10" />
                <p className="text-sm">Select a process from the list to start editing.</p>
            </div>
        )
    }

    return <ProcessEditor processId={processId} onClose={() => setProcessId(undefined)} />
}

const ProcessesPanel = ({ variant = 'content' }: ProcessesPanelProps): JSX.Element => {
    return variant === 'list' ? <ListVariant /> : <ContentVariant />
}

export default ProcessesPanel
