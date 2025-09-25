import { TabProvider } from '@renderer/components/navigation/TabContext';
import TabManager from './components/TabManager';

interface PageBuilderProps {
    basePath?: string;
    currentItem?: any;
}

const Index = ({ basePath, currentItem }: PageBuilderProps) => {
    return (
        <TabProvider>
            <TabManager basePath={basePath} currentItem={currentItem} />
        </TabProvider>
    );
};

export default Index;
