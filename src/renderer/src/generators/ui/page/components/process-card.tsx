import { JSX } from 'react/jsx-runtime';
import { Calendar, Trash2 } from 'lucide-react';
import {
    IGRPBadgePrimitive,
    IGRPCardPrimitive,
    IGRPCardContentPrimitive,
    IGRPCardTitlePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { BPMNProjectProcessDefinition } from 'src/main/types';

interface ProcessCardProps {
    process: BPMNProjectProcessDefinition;
    isSelected: boolean;
    onSelectProcess: (process: BPMNProjectProcessDefinition) => void;
}

export const ProcessCard = ({
    process,
    isSelected,
    onSelectProcess,
}: ProcessCardProps): JSX.Element => {
    return (
        <IGRPCardPrimitive
            className={`hover:shadow-md transition-all cursor-pointer ${
                isSelected ? 'ring-2 ring-primary ' : 'hover:bg-muted/30'
            }`}
            onClick={() => {
                onSelectProcess(process);
            }}
        >
            <IGRPCardContentPrimitive>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <IGRPCardTitlePrimitive className="text-base font-medium">
                            {process.title}
                        </IGRPCardTitlePrimitive>
                        <div className="flex items-center space-x-2 mt-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {process.deploymentDate && (
                                <span>
                                    Deployed on{' '}
                                    {new Date(
                                        process.deploymentDate || ''
                                    ).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-sm text-muted-foreground">
                            <Trash2 className="w-4 h-4" />
                            <span>
                                {process.processArtifacts?.length || 0} artifacts
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        <IGRPBadgePrimitive variant={'outline'}>
                            v{process.version || 'N/A'}
                            {' • Published'}
                        </IGRPBadgePrimitive>
                    </div>
                </div>
            </IGRPCardContentPrimitive>
        </IGRPCardPrimitive>
    );
};

