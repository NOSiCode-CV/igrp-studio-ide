import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@renderer/routes/routeConstants';
import { TabProvider } from '@renderer/components/navigation/TabContext';
import TabManager from './components/TabManager';
import { EngineService } from '@renderer/services/EngineService';
import { ComponentsProvider } from './contexts/ComponentsContext';
import { ComponentsLoader } from './components/ComponentsLoader';

interface PageBuilderProps {
    basePath?: string;
}

const Index = ({ basePath }: PageBuilderProps) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (basePath == '' || basePath === undefined) {
            navigate(ROUTES.HOME);
        }

        if (basePath) EngineService.startWatching(basePath);
    }, [basePath]);

    return (
        <TabProvider>
            <ComponentsProvider>
                <ComponentsLoader />
                {basePath && <TabManager basePath={basePath} />}
            </ComponentsProvider>
        </TabProvider>
    );
};

export default Index;
