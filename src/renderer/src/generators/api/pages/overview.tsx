import { useEffect, useState } from 'react';
import EmptyPage from './EmptyPage';
import { OptionType } from '@renderer/constants/appConstants';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@igrp/igrp-framework-react-design-system';
import DashboardOverview from '../components/dashboard-overview';

import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import { ContainerScrollArea } from '../components/ContainerScrollArea';
import { TabItem, useTabs } from '@renderer/components/navigation/TabContext';

interface NewProps {
    onOpenNew: (tab: TabItem) => void;
    open: OptionType;
}

const Overview = ({}: NewProps) => {
    const { t } = useTranslation();

    const { newTab } = useTabs();

    // Initialize stats with useState
    const [stats, setStats] = useState({
        modules: 0,
        controllers: 0,
        models: 0,
        dto: 0,
    });

    const handleOptionClick = (opt: OptionType) => {
        newTab({ type: opt });
    };

    const selectStudioState = (state: any) => state.PageBuilder;
    const selectStudioProperties = createSelector(
        selectStudioState,
        (studio) => ({ filesThree: studio.filesThree })
    );

    const { filesThree } = useSelector(selectStudioProperties);

    useEffect(() => {
        const newStats = { modules: 0, controllers: 0, models: 0, dto: 0 };

        newStats.modules = filesThree.filter(
            (file) => file.name !== 'shared'
        ).length;

        filesThree.forEach((file: any) => {
            if (!file.children) return;
            file.children.forEach((child: any) => {
                const { name, children } = child;
                if (name in newStats) {
                    newStats[name] += children?.length || 0;
                }
            });
        });

        setStats(newStats);
    }, [filesThree]);

    return (
        <ContainerScrollArea>
            <div className="w-full max-w-4xl mx-auto space-y-8 p-6 mb-10">
                <PageHeader
                    title={t('apiOverview')}
                    description={t('manageApiEndpoints')}
                />
                <DashboardOverview stats={stats} />
                <EmptyPage onClick={handleOptionClick} />
            </div>
        </ContainerScrollArea>
    );
};

export default Overview;
