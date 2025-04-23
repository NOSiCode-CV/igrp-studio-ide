import { useEffect, useState } from 'react';
import EmptyPage from './EmptyPage';
import { OptionType, projectIcons } from '@renderer/constants/appConstants';
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
import { Check, Copy, Folder, GitBranch } from 'lucide-react';
import { SpringConfigData } from 'src/main/types';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { useGit } from '@renderer/hooks/use-git';

interface NewProps {
    onOpenNew: (tab: TabItem) => void;
    open: OptionType;
}

const Overview = ({}: NewProps) => {
    const [copied, setCopied] = useState(false);
    const [projectId, setProjectId] = useState<string>('');
    const [repositoryUrl, setRepositoruUrl] = useState<string | null>(null);
    const { getRemoteUrl } = useGit();

    const { newTab } = useTabs();
    const {
        actions: { saveOrOpenProject },
    } = useWorkspace();

    const { config: project, filesThree, basePath } = useStudioAPI();

    const { config } = project || {};

    const [data, setData] = useState<SpringConfigData>(config);

    // Initialize stats with useState
    const [stats, setStats] = useState({
        modules: 0,
        controllers: 0,
        models: 0,
        dto: 0,
    });

    useEffect(() => {
        const fetchRemoteUrl = async () => {
            await getRemoteUrl(basePath).then(setRepositoruUrl);
        };
        fetchRemoteUrl();
    }, [basePath]);

    useEffect(() => {
        setProjectId(project?.id);
    }, [project]);

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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {projectId && (
                            <Card>
                                <CardHeader className="compact-card-header">
                                    <CardTitle>Project Details</CardTitle>
                                </CardHeader>
                                <CardContent className="compact-card-content space-y-2">
                                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-orange-500">
                                        <img
                                            src={
                                                projectIcons[project.framework]
                                            }
                                            alt={`${project.framework} logo`}
                                            width={16}
                                            height={16}
                                            className="h-68 w-8"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <div className="text-muted-foreground">
                                                Type
                                            </div>
                                            <div className="text-sm font-medium capitalize">
                                                {project.type}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-muted-foreground">
                                                Framework
                                            </div>
                                            <div className="text-sm font-medium capitalize">
                                                {project.framework}
                                            </div>
                                        </div>
                                    </div>
                                    {project.path && (
                                        <div>
                                            <div className="text-muted-foreground">
                                                Location
                                            </div>
                                            <div className="text-sm font-medium truncate">
                                                <Button variant={'link'}>
                                                    <Folder className="h-3.5 w-3.5" />
                                                    {project.path}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    {repositoryUrl && (
                                        <div>
                                            <div className="text-muted-foreground">
                                                Repository
                                            </div>
                                            <div className="text-sm font-medium truncate">
                                                <a
                                                    href={repositoryUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline flex items-center"
                                                >
                                                    <GitBranch className="h-3.5 w-3.5" />
                                                    {repositoryUrl.replace(
                                                        /^https?:\/\//,
                                                        ''
                                                    )}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                        <div className="col-span-2 gap-4">
                            {/*  <IGRPPageHeader
                                title={t('apiOverview')}
                                description={t('manageApiEndpoints')}
                            /> */}
                            <DashboardOverview stats={stats} />
                            <EmptyPage onClick={handleOptionClick} />
                        </div>
                    </div>
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
                                            className="h-8 font-mono bg-muted/50 flex-1 rounded-r-none"
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
