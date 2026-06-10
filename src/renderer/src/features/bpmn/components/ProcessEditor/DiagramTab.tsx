import { IGRPBpmnModeler } from '@igrp/framework-process-studio-bpmn-editor'
import { Button } from '@renderer/components/ui/button'
import { X } from 'lucide-react'
import type { JSX } from 'react'
import { DelegatesHelper } from './DelegatesHelper'

interface DiagramTabProps {
    /** Camunda XML produced after Activiti→Camunda conversion at the boundary. */
    xml: string
    processKey: string
    processName: string
    onChange: (xml: string) => void
    helperOpen: boolean
    onHelperClose: () => void
}

export function DiagramTab({
    xml,
    processKey,
    processName,
    onChange,
    helperOpen,
    onHelperClose
}: DiagramTabProps): JSX.Element {
    return (
        <div className="relative flex h-full">
            <div className="flex flex-1 flex-col">
                <div className="flex-1 overflow-hidden">
                    <IGRPBpmnModeler
                        xml={xml}
                        processKey={processKey}
                        processName={processName}
                        onChange={onChange}
                        className="h-full w-full"
                    />
                </div>
            </div>
            {helperOpen && (
                <aside className="w-[420px] shrink-0 overflow-auto border-l bg-background p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Delegates reference</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onHelperClose}
                            aria-label="Close delegates reference"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <DelegatesHelper />
                </aside>
            )}
        </div>
    )
}
