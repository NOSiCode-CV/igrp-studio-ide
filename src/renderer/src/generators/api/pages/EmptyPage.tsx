import { IGRPContainer } from '@igrp/igrp-framework-react-design-system';
import { Button } from '@renderer/components/ui/button';
import { Card, CardContent } from '@renderer/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { OPTION_TYPE } from '@renderer/constants/appConstants';
import { KeyboardKey } from '@renderer/constants/KeyboardKey';
import { SHORTCUTS } from '@renderer/constants/shortcutConstants';
import { useKeyPress } from '@renderer/hooks/useKeyDown';
import { FileCode, Database, FileText } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const EmptyPage = ({ onClick }) => {
    const { t } = useTranslation();

    const actions = [
        {
            title: t('newObject', { name: t('model') }),
            icon: <Database className="h-6 w-6" />,
            onClick: () => onClick(OPTION_TYPE.MODEL),
            shortcut: SHORTCUTS.NEW_MODEL, // Use a constante de atalho
        },
        {
            title: t('newObject', { name: t('controller') }),
            icon: <FileCode className="h-6 w-6" />,
            onClick: () => onClick(OPTION_TYPE.ACTION),
            shortcut: SHORTCUTS.NEW_CONTROLLER, // Use a constante de atalho
        },
        {
            title: t('newDto'),
            icon: <FileText className="h-6 w-6" />,
            onClick: () => onClick(OPTION_TYPE.DATA_OBJECTS),
            shortcut: SHORTCUTS.NEW_DTO, // Use a constante de atalho
        },
    ];

    useKeyPress(() => {
        onClick(OPTION_TYPE.MODEL);
    }, [KeyboardKey.model]);

    useKeyPress(() => {
        onClick(OPTION_TYPE.ACTION);
    }, [KeyboardKey.endpoint]);

    useKeyPress(() => {
        onClick(OPTION_TYPE.DATA_OBJECTS);
    }, [KeyboardKey.dto]);

    return (
        <IGRPContainer className="mb-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {actions.map((action, key) => (
                    <Card
                        key={key}
                        className="group hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={action.onClick}
                    >
                        <CardContent className="flex flex-col items-center justify-center space-y-4">
                            <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                {action.icon}
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="default"
                                        className="w-full truncate"
                                    >
                                        <span className="block text-ellipsis overflow-hidden whitespace-nowrap">
                                            {action.title} ({action.shortcut})
                                        </span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {action.title} - {action.shortcut}
                                </TooltipContent>
                            </Tooltip>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </IGRPContainer>
    );
};

export default EmptyPage;
