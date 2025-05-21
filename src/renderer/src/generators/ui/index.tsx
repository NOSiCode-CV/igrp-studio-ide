import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@renderer/routes/routeConstants';
import { TabProvider } from '@renderer/components/navigation/TabContext';
import TabManager from './components/TabManager';
import { EngineService } from '@renderer/services/EngineService';

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
            {basePath && <TabManager basePath={basePath} />}
        </TabProvider>
    );
};

export default Index;
