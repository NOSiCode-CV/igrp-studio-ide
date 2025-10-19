import { JSX } from 'react/jsx-runtime';
import { Component, EllipsisVertical, RotateCw, Wrench } from 'lucide-react';
import {
    IGRPBadgePrimitive,
    IGRPButtonPrimitive,
    IGRPCardPrimitive,
    IGRPCardContentPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardTitlePrimitive,
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import {
    BPMNProjectProcessDefinition,
    BPMNProjectArtifact,
    FileTree,
} from 'src/main/types';
import { PageDefinition } from '../page-manager';
import { convertFileTreeToPageDefinition } from '../utils/bpmn-helpers';

interface ProcessArtifactCardProps {
    artifact: BPMNProjectArtifact;
    selectedProcess: BPMNProjectProcessDefinition;
    stepProcessFound: FileTree | undefined;
    onPageClick?: (pageDefinition: PageDefinition) => void;
    onRegenerateStep: (
        process: BPMNProjectProcessDefinition,
        artifact: BPMNProjectArtifact
    ) => void;
}

export const ProcessArtifactCard = ({
    artifact,
    selectedProcess,
    stepProcessFound,
    onPageClick,
    onRegenerateStep,
}: ProcessArtifactCardProps): JSX.Element => {
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
                        <IGRPBadgePrimitive
                            variant="outline"
                            className="text-xs"
                        >
                            v{selectedProcess.version || 'N/A'}
                        </IGRPBadgePrimitive>
                        {stepProcessFound ? (
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
                                <IGRPDropdownMenuContentPrimitive
                                    align="end"
                                    className="w-56"
                                >
                                    <IGRPDropdownMenuItemPrimitive
                                        onClick={() =>
                                            onRegenerateStep(
                                                selectedProcess,
                                                artifact
                                            )
                                        }
                                    >
                                        <RotateCw className="mr-2 h-4 w-4" />
                                        Re-generate Step
                                    </IGRPDropdownMenuItemPrimitive>
                                </IGRPDropdownMenuContentPrimitive>
                            </IGRPDropdownMenuPrimitive>
                        ) : (
                            <IGRPButtonPrimitive
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                disabled
                            >
                                <EllipsisVertical className="h-4 w-4" />
                            </IGRPButtonPrimitive>
                        )}
                    </div>
                </div>
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
                            onPageClick?.(
                                convertFileTreeToPageDefinition(
                                    stepProcessFound
                                )
                            )
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
                        onClick={() =>
                            onRegenerateStep(selectedProcess, artifact)
                        }
                    >
                        <Wrench className="mr-2 h-4 w-4" />
                        Generate Step
                    </IGRPButtonPrimitive>
                )}
            </IGRPCardContentPrimitive>
        </IGRPCardPrimitive>
    );
};

