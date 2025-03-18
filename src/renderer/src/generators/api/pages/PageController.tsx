import { useEffect, useState } from 'react';
import ModelLayout from './model';
import DtoLayout from './dto';
import ControllerLayout from './controller';
import EmptyPage from './EmptyPage';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import { OPTION_TYPE, OptionType } from '@renderer/constants/appConstants';
import { useTranslation } from 'react-i18next';
import ControllerOverview from './controller/overview';
import { ResponseLayout } from './response';
import ERDLayout from './diagram';
import { EnumLayout } from './enum/EnumLayout';
import { EditorLayout } from './EditorLayout';
import { FileTree, ProjectData } from 'src/main/types';
import { TabItem, useTabs } from '@renderer/components/navigation/TabContext';
import { PermissionsLayout } from './permissions';

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

const PageController = ({ onOpenNew, open, tab }: NewProps) => {
    const [selectors, setSelectors] = useState<any[]>([]);
    const [option, setOption] = useState<OptionType>(open);
    const [module, setModule] = useState<string>('shared');

    const { t } = useTranslation();

    const { handleCloseTab, handleUpdateTab } = useTabs();

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
                console.error('Failed to fetch selectors:', error);
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

    const handleUpdate = (tabId: string) => {
        handleUpdateTab(tab.id, `tab-${tab.item?.module}-${tabId}`);
    };

    return (
        <>
            {option === 'none' && (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-4 bg-background">
                    <div className="w-full max-w-4xl space-y-8">
                        <EmptyPage onClick={handleOptionClick} />
                    </div>
                </div>
            )}

            {option === OPTION_TYPE.FILE_THREE && (
                <EditorLayout currentItem={tab.item} />
            )}
            {option === OPTION_TYPE.MODEL && (
                <ModelLayout
                    selectors={selectors}
                    currentItem={tab.item}
                    onCloseTab={hangleClose}
                    onUpdateTab={handleUpdate}
                />
            )}
            {option === OPTION_TYPE.ACTION && (
                <ControllerLayout
                    selectors={selectors}
                    currentItem={tab.item}
                    onCloseTab={hangleClose}
                    onUpdateTab={handleUpdate}
                />
            )}
            {option === OPTION_TYPE.CONTROLLER && (
                <ControllerOverview
                    basePath={basePath}
                    currentItem={tab.item}
                />
            )}
            {option === OPTION_TYPE.DATA_OBJECTS && (
                <DtoLayout
                    selectors={selectors}
                    currentItem={tab.item}
                    onCloseTab={hangleClose}
                    onUpdateTab={handleUpdate}
                />
            )}
            {option === OPTION_TYPE.RESPONSE && (
                <ResponseLayout
                    selectors={selectors}
                    currentItem={tab.item}
                    onCloseTab={hangleClose}
                    onUpdateTab={handleUpdate}
                />
            )}
            {option === OPTION_TYPE.ENUM && (
                <EnumLayout
                    selectors={selectors}
                    currentItem={tab.item}
                    onCloseTab={hangleClose}
                />
            )}
            {option === OPTION_TYPE.PERMISSIONS && (
                <PermissionsLayout
                    selectors={selectors}
                    currentItem={tab.item}
                    onCloseTab={hangleClose}
                />
            )}
            {option === OPTION_TYPE.ERDDiagram && (
                <ERDLayout currentItem={tab.item} />
            )}
        </>
    );
};

export default PageController;
