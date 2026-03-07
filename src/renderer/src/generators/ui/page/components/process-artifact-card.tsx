import {
    IGRPBadgePrimitive,
    IGRPButtonPrimitive,
    IGRPCardContentPrimitive,
    IGRPCardDescriptionPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardPrimitive,
    IGRPCardTitlePrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { AlertTriangle, Component, Copy, EllipsisVertical, RotateCw, Wrench } from 'lucide-react'
import type { JSX } from 'react/jsx-runtime'
import type { BPMNProjectArtifact, BPMNProjectProcessDefinition, FileTree } from 'src/main/types'
import type { PageDefinition } from '../page-manager'
import { convertFileTreeToPageDefinition } from '../utils/bpmn-helpers'
import { getFormKeyType, getNormalizedFormKey } from '../utils/form-key-utils'

interface ProcessArtifactCardProps {
    artifact: BPMNProjectArtifact
    selectedProcess: BPMNProjectProcessDefinition
    stepProcessFound: FileTree | undefined
    onPageClick?: (pageDefinition: PageDefinition) => void
    onRegenerateStep: (process: BPMNProjectProcessDefinition, artifact: BPMNProjectArtifact) => void
    onCopyFromLegacyVersion: (
        process: BPMNProjectProcessDefinition,
        artifact: BPMNProjectArtifact
    ) => void
}

export const ProcessArtifactCard = ({
    artifact,
    selectedProcess,
    stepProcessFound,
    onPageClick,
    onRegenerateStep,
    onCopyFromLegacyVersion
}: ProcessArtifactCardProps): JSX.Element => {
    const formKey = getNormalizedFormKey(artifact.formKey)
    const formKeyType = getFormKeyType(artifact.formKey)

    //if formKeyType is unknown, show a warning badge
    if (formKeyType === 'unknown' || formKeyType === 'shared') {
        return (
            <IGRPCardPrimitive className="hover:shadow-md transition-all cursor-pointer hover:bg-muted/30">
                <IGRPCardHeaderPrimitive>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <IGRPCardTitlePrimitive className="text-base font-medium">
                                {artifact.name}
                            </IGRPCardTitlePrimitive>
                            <div className="text-sm text-muted-foreground mt-1">
                                {artifact.taskKey}
                            </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                            <IGRPBadgePrimitive variant="outline" className="text-xs">
                                v{selectedProcess.version || 'N/A'}
                            </IGRPBadgePrimitive>
                            {formKeyType === 'unknown' && (
                                <IGRPBadgePrimitive variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-4 w-4" />
                                    Unknown Form Key
                                </IGRPBadgePrimitive>
                            )}
                        </div>
                    </div>
                    {formKeyType === 'shared' && (
                        <IGRPCardDescriptionPrimitive>
                            <div className="flex items-center space-x-2 justify-between">
                                <span>Form Key: {formKey}</span>
                                <IGRPBadgePrimitive variant="default" className="text-xs">
                                    {formKeyType}
                                </IGRPBadgePrimitive>
                            </div>
                        </IGRPCardDescriptionPrimitive>
                    )}
                </IGRPCardHeaderPrimitive>
            </IGRPCardPrimitive>
        )
    }

    return (
        <IGRPCardPrimitive className="hover:shadow-md transition-all cursor-pointer hover:bg-muted/30">
            <IGRPCardHeaderPrimitive>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <IGRPCardTitlePrimitive className="text-base font-medium">
                            {artifact.name}
                        </IGRPCardTitlePrimitive>
                        <div className="text-sm text-muted-foreground mt-1">{artifact.taskKey}</div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        <IGRPBadgePrimitive variant="outline" className="text-xs">
                            v{selectedProcess.version || 'N/A'}
                        </IGRPBadgePrimitive>
                        <IGRPDropdownMenuPrimitive>
                            <IGRPDropdownMenuTriggerPrimitive asChild>
                                <IGRPButtonPrimitive
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                >
                                    <EllipsisVertical className="h-4 w-4" />
                                </IGRPButtonPrimitive>
                            </IGRPDropdownMenuTriggerPrimitive>
                            <IGRPDropdownMenuContentPrimitive align="end" className="w-56">
                                <IGRPDropdownMenuItemPrimitive
                                    disabled={!stepProcessFound}
                                    onClick={() => onRegenerateStep(selectedProcess, artifact)}
                                >
                                    <RotateCw className="mr-2 h-4 w-4" />
                                    Re-generate Step
                                </IGRPDropdownMenuItemPrimitive>
                                <IGRPDropdownMenuItemPrimitive
                                    onClick={() =>
                                        onCopyFromLegacyVersion(selectedProcess, artifact)
                                    }
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy From Legacy Version
                                </IGRPDropdownMenuItemPrimitive>
                            </IGRPDropdownMenuContentPrimitive>
                        </IGRPDropdownMenuPrimitive>
                    </div>
                </div>

                <IGRPCardDescriptionPrimitive>
                    <div className="flex items-center space-x-2 justify-between">
                        <span>Form Key: {formKey}</span>
                        <IGRPBadgePrimitive variant="outline" className="text-xs">
                            {formKeyType}
                        </IGRPBadgePrimitive>
                    </div>
                </IGRPCardDescriptionPrimitive>
            </IGRPCardHeaderPrimitive>
            <IGRPCardContentPrimitive className="space-y-2">
                {artifact.subProcessTask && (
                    <IGRPBadgePrimitive variant="outline" className="text-xs">
                        {`Sub Process - ${artifact.subProcessName}`}
                    </IGRPBadgePrimitive>
                )}
                {stepProcessFound ? (
                    <IGRPButtonPrimitive
                        size="sm"
                        className="w-full"
                        variant="outline"
                        onClick={() =>
                            onPageClick?.(convertFileTreeToPageDefinition(stepProcessFound))
                        }
                    >
                        <Component className="mr-2 h-4 w-4" />
                        Add Components
                    </IGRPButtonPrimitive>
                ) : (
                    <IGRPButtonPrimitive
                        size="sm"
                        className="w-full"
                        variant="default"
                        onClick={() => onRegenerateStep(selectedProcess, artifact)}
                    >
                        <Wrench className="mr-2 h-4 w-4" />
                        Generate Step
                    </IGRPButtonPrimitive>
                )}
            </IGRPCardContentPrimitive>
        </IGRPCardPrimitive>
    )
}
