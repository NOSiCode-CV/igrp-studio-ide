import {
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsPrimitive,
    IGRPTabsTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { SubHeadline } from '@renderer/components/shared-ui'
import { BPMNConnectionsManager } from '@renderer/features/bpmn/components/connection/BPMNConnectionsManager'
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

            <IGRPTabsPrimitive defaultValue="projects" className="space-y-4">
                <IGRPTabsListPrimitive>
                    <IGRPTabsTriggerPrimitive value="projects">Projects</IGRPTabsTriggerPrimitive>
                    <IGRPTabsTriggerPrimitive value="configuration">
                        API Configuration
                    </IGRPTabsTriggerPrimitive>
                </IGRPTabsListPrimitive>

                <IGRPTabsContentPrimitive value="projects" className="space-y-4">
                    <BPMNProjectSelector
                        onPageClick={onPageClick}
                        bpmnProcesses={bpmnProcesses}
                        basePath={basePath}
                    />
                </IGRPTabsContentPrimitive>

                <IGRPTabsContentPrimitive value="configuration" className="space-y-4">
                    <BPMNConnectionsManager />
                </IGRPTabsContentPrimitive>
            </IGRPTabsPrimitive>
        </div>
    )
}
