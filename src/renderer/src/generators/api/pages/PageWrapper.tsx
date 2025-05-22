import { useEffect, useState } from 'react';
import ModelLayout from './model';
import DtoLayout from './dto';
import EmptyPage from './EmptyPage';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import { OPTION_TYPE, OptionType } from '@renderer/constants/appConstants';
import { useTranslation } from 'react-i18next';
import ControllerOverview from './controller/overview';
import { ResponseLayout } from './response';
import ERDLayout from './diagram';
import { EnumLayout } from './enum';
import { EditorLayout } from './EditorLayout';
import { FileTree, ProjectData } from 'src/main/types';
import { TabItem, useTabs } from '@renderer/components/navigation/TabContext';
import { PermissionsLayout } from './permissions';
import { ControllerLayout } from './controller';

interface PageBuilderState {
    basePath: string;
    currentItem: any;
    filesThree: FileTree[];
    config: ProjectData;
}

interface NewProps {
    onOpenNew: (tab: TabItem) => void;
    open: OptionType;
    tab: TabItem;
}

const componentMap = {
    [OPTION_TYPE.FILE_THREE]: EditorLayout,
    [OPTION_TYPE.MODEL]: ModelLayout,
    [OPTION_TYPE.ACTION]: ControllerLayout,
    [OPTION_TYPE.CONTROLLER]: ControllerOverview,
    [OPTION_TYPE.DATA_OBJECTS]: DtoLayout,
    [OPTION_TYPE.RESPONSE]: ResponseLayout,
    [OPTION_TYPE.ENUM]: EnumLayout,
    [OPTION_TYPE.PERMISSIONS]: PermissionsLayout,
    [OPTION_TYPE.ERDDiagram]: ERDLayout,
};

const PageWrapper = ({ onOpenNew, open, tab }: NewProps) => {
    const [selectors, setSelectors] = useState<any[]>([]);
    const [option, setOption] = useState<OptionType>(open);
    const [module, setModule] = useState<string>('shared');

    const { t } = useTranslation();

    const { handleCloseTab } = useTabs();

    const selectState = (state: any): PageBuilderState => state.PageBuilder;

    const selectProperties = createSelector(selectState, (studio) => {
        return {
            basePath: studio.basePath,
        };
    });

    const { basePath } = useSelector(selectProperties);

    useEffect(() => {
        const getAllSelectors = async () => {
            try {
                const allSelectors = await window.api.fetchSelectors(
                    module,
                    basePath
                );
                setSelectors(allSelectors);
            } catch (error) {
                console.error(t("failedFetchSelectors"), error);
            }
        };

        if (basePath) {
            getAllSelectors();
        }
    }, [basePath, module]);

    useEffect(() => {
        if (tab.item) setModule(tab.item.module || module);
    }, [tab]);

    const handleOptionClick = (opt: OptionType) => {
        setOption(opt);
        onOpenNew({
            ...tab,
            title: t(`new${opt.charAt(0).toUpperCase() + opt.slice(1)}`),
            open: opt,
        });
    };

    const hangleClose = () => {
        handleCloseTab(tab.id);
    };

    const Component = componentMap[option];

    return (
        <>
            {option === 'none' && (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-4 bg-background">
                    <div className="w-full max-w-4xl space-y-8">
                        <EmptyPage onClick={handleOptionClick} />
                    </div>
                </div>
            )}

            {Component && (
                <Component
                    selectors={selectors}
                    currentItem={tab.item}
                    onCloseTab={hangleClose}
                    basePath={basePath}
                />
            )}
        </>
    );
};

export default PageWrapper;
