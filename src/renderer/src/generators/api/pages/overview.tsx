import { useEffect, useState } from 'react';
import EmptyPage from './EmptyPage';
import { OptionType } from '@renderer/constants/appConstants';
import { TabItem } from '@renderer/generators/api/components/TabManager';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@igrp/igrp-design-system';
import DashboardOverview from '../components/dashboard-overview';

import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import { ContainerScrollArea } from '../components/ContainerScrollArea';

interface NewProps {
    onOpenNew: (tab: TabItem) => void;
    open: OptionType;
}

const Overview = ({ onOpenNew }: NewProps): JSX.Element => {
    const { t } = useTranslation();

    // Initialize stats with useState
    const [stats, setStats] = useState({
        modules: 0,
        controllers: 0,
        schemas: 0,
        dtos: 0,
    });

    const handleOptionClick = (opt: OptionType) => {
        onOpenNew({
            id: `tab-${Date.now()}`,
            title: t(`new${opt.charAt(0).toUpperCase() + opt.slice(1)}`),
            open: opt,
        });
    };

    const selectStudioState = (state: any) => state.PageBuilder;
    const selectStudioProperties = createSelector(
        selectStudioState,
        (studio) => ({
            folders: studio.folderFiles,
        })
    );

    const { folders } = useSelector(selectStudioProperties);

    useEffect(() => {
        const newStats = { modules: 0, controllers: 0, schemas: 0, dtos: 0 };

        const folderArray = Object.values(folders);

        newStats.modules = folderArray.length > 1 ? folderArray.length - 1 : 0;

        folderArray.forEach((module: any) => {
            if (module.files) {
                module.files.forEach((file: any) => {
                    if (file.controllers) {
                        newStats.controllers += file.controllers.length;
                    }
                    if (file.models) {
                        newStats.schemas += file.models.length;
                    }
                    if (file.dto) {
                        newStats.dtos += file.dto.length;
                    }
                });
            }
        });

        setStats(newStats);
    }, [folders]);

    return (
        <ContainerScrollArea>
            <div className="w-full max-w-4xl space-y-8 p-6">
                <PageHeader
                    title="API Overview"
                    description="Manage your API endpoints"
                />
                <DashboardOverview stats={stats} />
                <EmptyPage onClick={handleOptionClick} />
            </div>
        </ContainerScrollArea>
    );
};

export default Overview;
