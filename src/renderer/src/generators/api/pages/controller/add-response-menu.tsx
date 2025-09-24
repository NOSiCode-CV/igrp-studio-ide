'use client';

import * as React from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { IGRPButtonPrimitive, IGRPHoverCardContentPrimitive, IGRPHoverCardPrimitive, IGRPHoverCardTriggerPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPPopoverPrimitive,
    IGRPPopoverContentPrimitive,
    IGRPPopoverTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { useTranslation } from 'react-i18next';

interface AddResponseMenuProps {
    onAddBlankResponse: () => void;
    onSave: (response: {
        name: string;
        statusCode: string;
        contentType: string;
    }) => void;
    responseTypes: Array<any>;
}

export const AddResponseMenu: React.FC<AddResponseMenuProps> = ({
    onAddBlankResponse,
    responseTypes,
    onSave,
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = React.useState(false);

    const handleClick = (resp: any) => {
        const contentType = Object.keys(resp.content)[0];

        const { name, statusCode } = resp;

        const response = {
            name,
            statusCode,
            contentType,
        };

        onSave(response);
    };

    const ErrorList = () => (
        <div className="py-2">
            {responseTypes.map((response, index) => (
                <div
                    key={index}
                    className="px-4 py-1.5 flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"
                    onClick={() => {
                        handleClick(response.content);
                    }}
                >
                    <div className="flex items-center justify-center w-5 h-5 rounded bg-primary/25 text-igrp">
                        R
                    </div>
                    {` ${response.content.name} (${response.content.statusCode})`}
                </div>
            ))}
        </div>
    );

    return (
        <div className="relative">
            <IGRPPopoverPrimitive open={isOpen} onOpenChange={setIsOpen}>
                <IGRPPopoverTriggerPrimitive asChild>
                    <IGRPButtonPrimitive
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                    >
                        <Plus className="h-4 w-4" />
                        {t('add')}
                    </IGRPButtonPrimitive>
                </IGRPPopoverTriggerPrimitive>
                <IGRPPopoverContentPrimitive className="p-0" align="end">
                    <div className="flex flex-col">
                        <IGRPButtonPrimitive
                            variant="ghost"
                            className="justify-start px-4 py-2 text-sm font-normal"
                            onClick={() => {
                                onAddBlankResponse();
                                setIsOpen(false);
                            }}
                        >
                            {t('addBlankResponse')}
                        </IGRPButtonPrimitive>
                        <IGRPHoverCardPrimitive openDelay={0} closeDelay={0}>
                            <IGRPHoverCardTriggerPrimitive asChild>
                                <IGRPButtonPrimitive
                                    variant="ghost"
                                    className="justify-between px-4 py-2 text-sm font-normal hover:bg-muted group"
                                >
                                    {t('referenceResponseComponent')}
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </IGRPButtonPrimitive>
                            </IGRPHoverCardTriggerPrimitive>
                            {responseTypes && responseTypes.length > 0 && (
                                <IGRPHoverCardContentPrimitive
                                    className="w-60 p-0"
                                    align="start"
                                    sideOffset={-44}
                                    alignOffset={-250}
                                >
                                    <div className="border-t">
                                        <ErrorList />
                                    </div>
                                </IGRPHoverCardContentPrimitive>
                            )}
                        </IGRPHoverCardPrimitive>
                    </div>
                </IGRPPopoverContentPrimitive>
            </IGRPPopoverPrimitive>
        </div>
    );
};
