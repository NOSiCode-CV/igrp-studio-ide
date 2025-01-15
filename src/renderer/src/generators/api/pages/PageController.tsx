import { useEffect, useState } from 'react';
import ModelLayout from './model';
import DtoLayout from './dto';
import ControllerLayout from './controller';
import EmptyPage from './EmptyPage';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import { extractByType, getMergedFiles, getModulesArray } from '../helpers';
import { OPTION_TYPE, OptionType } from '@renderer/constants/appConstants';
import { TabItem } from '@renderer/generators/api/components/TabManager';
import { useTranslation } from 'react-i18next';
import ControllerOverview from './controller/overview';
import { ResponseLayout } from './response';
import ERDLayout from './diagram';

interface PageBuilderState {
    basePath: string;
    currentItem: any;
    folderFiles: {
        models?: any[];
        dto?: any[];
    };
}

interface NewProps {
    onOpenNew: (tab: TabItem) => void;
    open: OptionType;
    tab: TabItem;
    onCloseTab: (tab: string) => void;
    onUpdateTab: (oldId: string, newId: string) => void;
}

const PageController = ({
    onOpenNew,
    onCloseTab,
    onUpdateTab,
    open,
    tab,
}: NewProps): JSX.Element => {
    const [selectors, setSelectors] = useState<any[]>([]);
    const [option, setOption] = useState<OptionType>(open);
    const [module, setModule] = useState<string>('');

    const { t } = useTranslation();

    const selectState = (state: any): PageBuilderState => state.PageBuilder;

    const selectProperties = createSelector(selectState, (studio) => {
        const moduleData = getMergedFiles(studio, module);
        return {
            basePath: studio.basePath,
            models: extractByType(moduleData, OPTION_TYPE.MODELS),
            dto: extractByType(moduleData, OPTION_TYPE.DATA_OBJECTS),
            controllers: extractByType(moduleData, OPTION_TYPE.CONTROLLERS),
            responses: extractByType(moduleData, OPTION_TYPE.RESPONSE),
            modules: getModulesArray(studio.folderFiles),
            folderFiles: studio.folderFiles,
        };
    });

    const { basePath, models, dto, modules, responses } =
        useSelector(selectProperties);

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
        onCloseTab(tab.id);
    };

    const handleUpdate = (tabId: string) => {
        onUpdateTab(tab.id, `tab-${tab.item?.module}-${tabId}`);
    };

    //console.log(tab.item)

    return (
        <>
            {option === 'none' && (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-4 bg-background">
                    <div className="w-full max-w-4xl space-y-8">
                        <EmptyPage onClick={handleOptionClick} />
                    </div>
                </div>
            )}
            {option === OPTION_TYPE.MODEL && (
                <ModelLayout
                    basePath={basePath}
                    selectors={selectors}
                    models={models}
                    currentItem={tab.item}
                    onCloseTab={hangleClose}
                    onUpdateTab={handleUpdate}
                />
            )}
            {option === OPTION_TYPE.ACTION && (
                <ControllerLayout
                    basePath={basePath}
                    selectors={selectors}
                    currentItem={tab.item}
                    modules={modules}
                    dto={dto}
                    responses={responses}
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
                    basePath={basePath}
                    selectors={selectors}
                    dto={dto}
                    models={models}
                    currentItem={tab.item}
                    onCloseTab={hangleClose}
                    onUpdateTab={handleUpdate}
                />
            )}
            {option === OPTION_TYPE.RESPONSE && (
                <ResponseLayout
                    basePath={basePath}
                    selectors={selectors}
                    currentItem={tab.item}
                    onCloseTab={hangleClose}
                    onUpdateTab={handleUpdate}
                />
            )}
            {option === OPTION_TYPE.ERDDiagram && <ERDLayout models={models} />}
        </>
    );
};

export default PageController;
