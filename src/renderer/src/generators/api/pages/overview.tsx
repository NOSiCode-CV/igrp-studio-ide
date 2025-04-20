import { useEffect, useState } from 'react';
import EmptyPage from './EmptyPage';
import { OptionType } from '@renderer/constants/appConstants';
import { useTranslation } from 'react-i18next';
import { IGRPPageHeader } from '@igrp/igrp-framework-react-design-system';
import DashboardOverview from '../components/dashboard-overview';

import { TabItem, useTabs } from '@renderer/components/navigation/TabContext';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import { ProjectConfigForm } from '@renderer/pages/project';
import { Button } from '@renderer/components/ui/button';
import useStudioAPI from '@renderer/hooks/use-studio-api';
import { Label } from '@renderer/components/ui/label';
import { Input } from '@renderer/components/ui/input';
import { Check, Copy } from 'lucide-react';
import { SpringConfigData } from 'src/main/types';
import { useWorkspace } from '@renderer/hooks/use-workspace';

interface NewProps {
    onOpenNew: (tab: TabItem) => void;
    open: OptionType;
}

const Overview = ({}: NewProps) => {
    const [copied, setCopied] = useState(false);

    const { t } = useTranslation();

    const { newTab } = useTabs();
    const {
        actions: { saveOrOpenProject },
    } = useWorkspace();

    const { config: project, filesThree } = useStudioAPI();

    const { config, id: projectId } = project;

    const [data, setData] = useState<SpringConfigData>(config);

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

    useEffect(() => {
        setData(config);
    }, [project]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        saveOrOpenProject({ ...project, config: data });
    };

    return (
        <div className="w-full mx-auto space-y-8 p-6">
            <Tabs defaultValue="overview" className="compact-tabs">
                <TabsList className="mb-3">
                    <TabsTrigger value="overview" className="text-xs">
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="text-xs">
                        Settings
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-0 space-y-4">
                    <IGRPPageHeader
                        title={t('apiOverview')}
                        description={t('manageApiEndpoints')}
                    />
                    <DashboardOverview stats={stats} />
                    <EmptyPage onClick={handleOptionClick} />
                </TabsContent>
                <TabsContent value="settings" className="mt-0 space-y-4">
                    <Card>
                        <CardHeader className="compact-card-header">
                            <CardTitle className="text-sm">
                                Project Settings
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Configure project settings and options
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="compact-card-content space-y-3">
                            {projectId && (
                                <div className="space-y-2">
                                    <Label htmlFor="project-id">
                                        Project ID
                                    </Label>
                                    <div className="flex space-x-2">
                                        <Input
                                            id="project-id"
                                            value={projectId}
                                            readOnly
                                            className="h-8 text-xs font-mono bg-muted/50 flex-1 rounded-r-none"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 rounded-l-none border-l-0"
                                            onClick={() =>
                                                copyToClipboard(projectId)
                                            }
                                        >
                                            {copied ? (
                                                <Check className="h-3.5 w-3.5" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        This is the unique identifier for your
                                        project.
                                    </p>
                                </div>
                            )}
                            <ProjectConfigForm
                                type={'springboot'}
                                data={data}
                                errors={{}}
                                onChange={setData}
                            />
                            <div className="pt-2">
                                <Button onClick={handleSave}>
                                    Save Settings
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Overview;
