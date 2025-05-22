import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Button } from '@renderer/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { APRESENTATION } from '@renderer/constants/appConstants';
import { useTranslation } from 'react-i18next';

interface NavigationBarProps {
    activePresentation: string;
    onSwitch: (activePresentation: string) => void;
    onSave?: () => void;
    basePath: string;
    page: string;
}

const NavigationBar = ({
    onSwitch,
    onSave,
    activePresentation,
}: NavigationBarProps) => {
    const { t } = useTranslation();

    /*     const { tabs, activeTab, initializeTabFromCurrentItem } = useTabs();
     */
    const handleSaveClick = () => {
        onSave?.();
    };

    /*     const onClickSourceCode = () => {
        const tab = tabs.filter((t) => t.id === activeTab);

        const page = tab[0];
        initializeTabFromCurrentItem({
            path: `${basePath}/src/app/pages/${page.item.label.toLowerCase()}/page.tsx`,
            type: OPTION_TYPE.FILE_THREE,
            label: `${page.item.label}.tsx`,
        });
    }; */

    return (
        <TooltipProvider>
            <div className="flex flex-1 justify-end items-center space-x-2">
                {/*  <PreviewMenu basePath={basePath} /> */}

                {/*   <Tooltip>
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
                </Tooltip> */}
                <div className="relative flex rounded-lg border bg-muted p-0.5 text-sm space-x-2">
                    <Button
                        size="sm"
                        variant={
                            activePresentation === APRESENTATION.CODE
                                ? 'outline'
                                : 'ghost'
                        }
                        onClick={() => onSwitch(APRESENTATION.CODE)}
                        className="h-7"
                    >
                        Code
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => onSwitch(APRESENTATION.DESIGN)}
                        variant={
                            activePresentation === APRESENTATION.DESIGN
                                ? 'outline'
                                : 'ghost'
                        }
                        className="h-7"
                    >
                        Design
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => onSwitch(APRESENTATION.JSON)}
                        variant={
                            activePresentation === APRESENTATION.JSON
                                ? 'outline'
                                : 'ghost'
                        }
                        className="h-7"
                    >
                        Json
                    </Button>
                </div>
                {/*  <div className="relative flex rounded-lg border bg-muted p-0.5 text-sm space-x-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                onClick={onSwitch}
                                variant={'secondary'}
                            >
                                {isDesign ? <FileJsonIcon /> : <Eye />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {isDesign ? 'Show Code [JSON]' : 'Show Design'}
                        </TooltipContent>
                    </Tooltip>
                </div> */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="sm" onClick={handleSaveClick}>
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
