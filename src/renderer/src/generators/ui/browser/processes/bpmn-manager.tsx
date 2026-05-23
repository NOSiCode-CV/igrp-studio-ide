import { SubHeadline } from '@renderer/components/shared-ui'
import type { FileTree } from 'src/main/types'
import type { PageDefinition } from '../page-manager'
import { BPMNProjectSelector } from './bpmn-project-selector'

interface BPMNManagerProps {
    onPageClick?: (pageDefinition: PageDefinition | FileTree) => void
    bpmnProcesses: FileTree[]
    basePath: string
}

export const BPMNManager = ({
    onPageClick,
    bpmnProcesses,
    basePath
}: BPMNManagerProps): React.JSX.Element => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <SubHeadline
                    title="BPMN Process Manager"
                    description="Connect to BPMN REST API and manage process definitions"
                />
            </div>

            <BPMNProjectSelector
                onPageClick={onPageClick}
                bpmnProcesses={bpmnProcesses}
                basePath={basePath}
            />
        </div>
    )
}
