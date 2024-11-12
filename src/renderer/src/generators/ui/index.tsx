import React, { useEffect, useState } from 'react';
import Content from './components/TabManager';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@renderer/routes/routeConstants';

interface PageBuilderProps {
    basePath?: string
}

const Index = ({ basePath }: PageBuilderProps) => {

    const [tabs, setTabs] = useState(['PageBuilder']);
    const [activeTab, setActiveTab] = useState('PageBuilder');

    const navigate = useNavigate()

    const handlePageClick = (page: string) => {
        if (!tabs.includes(page)) {
            setTabs([...tabs, page]);
        }
        setActiveTab(page);
    };

    const handleCloseTab = (tab: string) => {
        const newTabs = tabs.filter(t => t !== tab);
        setTabs(newTabs);
        if (activeTab === tab) {
            const newIndex = tabs.indexOf(tab) - 1;
            setActiveTab(newTabs[newIndex] || 'PageBuilder');
        }
    };

    useEffect(() => {
        if (basePath === '' || basePath === undefined) {
            navigate(ROUTES.HOME)
        }
    }, [basePath])

    return (
        <Content basePath={basePath} tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} onPageClick={handlePageClick} onCloseTab={handleCloseTab} />
    );
};

export default Index;
