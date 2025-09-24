import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPTooltipPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { cn } from '@renderer/lib/utils';
import React from 'react';

interface RelationTypeSelectorProps {
    value: string;
    onChange: (value: string) => void;
    sourceField?: string;
    targetField?: string;
}

const relationTypeIcons = {
    OneToOne: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="16"
            height="16"
            fill="currentColor"
        >
            <path
                fillRule="evenodd"
                d="M10.874 17A4.002 4.002 0 0 1 3 16a4 4 0 0 1 7.874-1h10.252A4.002 4.002 0 0 1 29 16a4 4 0 0 1-7.874 1zM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4m18 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4"
                clipRule="evenodd"
            />
        </svg>
    ),
    OneToMany: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="16"
            height="16"
            fill="currentColor"
        >
            <path
                fillRule="evenodd"
                d="M17.2 8.254a4 4 0 1 1 1.082 1.682l-7.482 4.81q.04.125.074.254h10.252A4.002 4.002 0 0 1 29 16a4 4 0 0 1-7.874 1H10.874q-.033.128-.075.254l7.484 4.81a4 4 0 1 1-1.082 1.682l-7.484-4.81a4 4 0 1 1 0-5.871zM21 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4m0 18a2 2 0 1 1 0-4 2 2 0 0 1 0 4m2-11a2 2 0 1 0 4 0 2 2 0 0 0-4 0M7 18a2 2 0 1 1 0-4 2 2 0 0 1 0 4"
                clipRule="evenodd"
            />
        </svg>
    ),
    ManyToOne: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="16"
            height="16"
            fill="currentColor"
        >
            <path
                fillRule="evenodd"
                d="M14.8 8.254a4 4 0 1 0-1.082 1.682l7.483 4.81a4 4 0 0 0-.075.254H10.874A4.002 4.002 0 0 0 3 16a4 4 0 0 0 7.874 1h10.252q.033.128.075.254l-7.484 4.81a4 4 0 1 0 1.082 1.682l7.484-4.81a4 4 0 1 0 0-5.871zM11 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4m0 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4M9 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0m16 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4"
                clipRule="evenodd"
            />
        </svg>
    ),
    ManyToMany: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="16"
            height="16"
            fill="currentColor"
        >
            <path
                fillRule="evenodd"
                d="M11 7q0 .432-.088.838L16 10.382l5.088-2.544a4 4 0 1 1 .895 1.789L18.236 11.5l3.747 1.873a4 4 0 1 1 0 5.253L18.236 20.5l3.747 1.874a4 4 0 1 1-.895 1.788L16 21.618l-5.088 2.544Q11 24.567 11 25a4 4 0 1 1-.983-2.626l3.747-1.874-3.747-1.873a4 4 0 1 1 0-5.253l3.747-1.874-3.747-1.874A4 4 0 1 1 11 7M9 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0m2.236 8h9.528L16 12.618zM9 25a2 2 0 1 1-4 0 2 2 0 0 1 4 0m-2-7a2 2 0 1 0 0-4 2 2 0 0 0 0 4M27 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0m-2 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4m2-11a2 2 0 1 1-4 0 2 2 0 0 1 4 0m-11 3.382L20.764 17h-9.528z"
                clipRule="evenodd"
            />
        </svg>
    ),
};

export function RelationTypeSelector({
    value,
    onChange,
}: RelationTypeSelectorProps) {
    return (
        <>
            <div className="flex items-center justify-center">
                <div className="flex items-center relative">
                    <div className="w-6 h-0.5 bg-primary" />
                    {Object.keys(relationTypeIcons).map(
                        (type, index, array) => (
                            <React.Fragment key={type}>
                                <IGRPTooltipPrimitive>
                                    <IGRPTooltipTriggerPrimitive asChild>
                                        <IGRPButtonPrimitive
                                            size="icon"
                                            onClick={() => onChange(type)}
                                            className={cn(
                                                'transition-colors relative',
                                                value === type &&
                                                    'text-muted-foreground bg-secondary/10 border border-secondary shadow-lg'
                                            )}
                                        >
                                            {
                                                relationTypeIcons[
                                                    type as keyof typeof relationTypeIcons
                                                ]
                                            }
                                        </IGRPButtonPrimitive>
                                    </IGRPTooltipTriggerPrimitive>
                                    <IGRPTooltipContentPrimitive>
                                        <p>{type}</p>
                                    </IGRPTooltipContentPrimitive>
                                </IGRPTooltipPrimitive>
                                {index < array.length - 1 && (
                                    <div className="w-6 h-0.5 bg-primary" />
                                )}
                            </React.Fragment>
                        )
                    )}
                    <div className="w-6 h-0.5 bg-primary" />
                </div>
            </div>
        </>
    );
}
