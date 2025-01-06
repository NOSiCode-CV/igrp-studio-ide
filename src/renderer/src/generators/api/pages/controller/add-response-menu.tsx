'use client';

import * as React from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@renderer/components/ui/popover';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@renderer/components/ui/hover-card';

interface AddResponseMenuProps {
    onAddBlankResponse: () => void;
}

export const AddResponseMenu: React.FC<AddResponseMenuProps> = ({
    onAddBlankResponse,
}) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const ErrorList = () => (
        <div className="py-2">
            <div className="px-4 py-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center w-5 h-5 rounded bg-purple-50 text-igrp">
                    R
                </div>
                Record not found(404)
            </div>
            <div className="px-4 py-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center w-5 h-5 rounded bg-purple-50 text-igrp">
                    R
                </div>
                Invalid input(400)
            </div>
        </div>
    );

    return (
        <div className="relative">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Plus className="h-4 w-4" />
                        Add
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="end">
                    <div className="flex flex-col">
                        <Button
                            variant="ghost"
                            className="justify-start px-4 py-2 text-sm font-normal"
                            onClick={() => {
                                onAddBlankResponse();
                                setIsOpen(false);
                            }}
                        >
                            Add Blank Response
                        </Button>
                        <HoverCard openDelay={0} closeDelay={0}>
                            <HoverCardTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="justify-between px-4 py-2 text-sm font-normal hover:bg-muted group"
                                >
                                    Reference Response Component
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </HoverCardTrigger>
                            <HoverCardContent
                                className="w-60 p-0"
                                align="start"
                                sideOffset={-44}
                                alignOffset={-250}
                            >
                                <div className="border-t">
                                    <ErrorList />
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};
