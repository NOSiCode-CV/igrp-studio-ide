import {
    IGRPButtonPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipPrimitive,
    IGRPTooltipProviderPrimitive,
    IGRPTooltipTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
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
        <IGRPTooltipProviderPrimitive>
            <div className="flex flex-1 justify-end items-center space-x-2">
                {/*  <PreviewMenu basePath={basePath} /> */}

                {/*   <IGRPTooltip>
                    <IGRPTooltipTrigger asChild>
                        <IGRPButtonPrimitive
                            size="sm"
                            variant={'secondary'}
                            onClick={onClickSourceCode}
                        >
                            <AppWindowMac />
                        </IGRPButtonPrimitive>
                    </IGRPTooltipTrigger>
                    <IGRPTooltipContent>{t('sourceCode')}</IGRPTooltipContent>
                </IGRPTooltip> */}
                <div className="relative flex rounded-lg border bg-muted p-0.5 text-sm space-x-2">
                    <IGRPButtonPrimitive
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
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive
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
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive
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
                    </IGRPButtonPrimitive>
                </div>
                {/*  <div className="relative flex rounded-lg border bg-muted p-0.5 text-sm space-x-2">
                    <IGRPTooltip>
                        <IGRPTooltipTrigger asChild>
                            <IGRPButtonPrimitive
                                size="sm"
                                onClick={onSwitch}
                                variant={'secondary'}
                            >
                                {isDesign ? <FileJsonIcon /> : <Eye />}
                            </IGRPButtonPrimitive>
                        </IGRPTooltipTrigger>
                        <IGRPTooltipContent>
                            {isDesign ? 'Show Code [JSON]' : 'Show Design'}
                        </IGRPTooltipContent>
                    </IGRPTooltip>
                </div> */}
                <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive asChild>
                        <IGRPButtonPrimitive
                            size="sm"
                            onClick={handleSaveClick}
                        >
                            {t('save')}
                        </IGRPButtonPrimitive>
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive>
                        {'Add Components to Page'}
                    </IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>
            </div>
        </IGRPTooltipProviderPrimitive>
    );
};

export default NavigationBar;
