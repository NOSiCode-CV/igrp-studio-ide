import { TooltipProvider } from '@radix-ui/react-tooltip';
import { useTabs } from '@renderer/components/navigation/TabContext';
import { Button } from '@renderer/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { OPTION_TYPE } from '@renderer/constants/appConstants';
import { AppWindowMac, Code, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NavigationBarProps {
    isDesign: boolean;
    onSwitch?: () => void;
    onSave?: () => void;
    basePath: string;
    page: string;
}

const NavigationBar = ({
    onSwitch,
    onSave,
    basePath,
    isDesign,
}: NavigationBarProps) => {
    const { t } = useTranslation();

    const { tabs, activeTab, initializeTabFromCurrentItem } = useTabs();

    const handleSaveClick = () => {
        onSave?.();
    };

    const onClickSourceCode = () => {
        const tab = tabs.filter((t) => t.id === activeTab);

        console.log(tab);

        const page = tab[0];
        initializeTabFromCurrentItem({
            path: `${basePath}/src/app/pages/${page.item.label.toLowerCase()}/page.tsx`,
            type: OPTION_TYPE.FILE_THREE,
            label: `${page.item.label}.tsx`,
        });
    };

    return (
        <TooltipProvider>
            <div className="flex flex-1 justify-end items-center space-x-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="sm"
                            variant={'secondary'}
                            onClick={onClickSourceCode}
                        >
                            <AppWindowMac />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('sourceCode')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="sm"
                            onClick={onSwitch}
                            className="hover:bg-igrp"
                            variant={'secondary'}
                        >
                            {isDesign ? <Eye /> : <Code />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {isDesign ? 'Show Code [JSON]' : 'Show Design'}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="sm"
                            className="hover:text-igrp"
                            onClick={handleSaveClick}
                        >
                            {t('save')}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t('Add Components to Page')}
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
};

export default NavigationBar;
