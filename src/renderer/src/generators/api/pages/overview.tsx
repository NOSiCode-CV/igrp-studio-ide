import { useEffect, useState } from 'react';
import DashboardOverview from '../components/dashboard-overview';
import { useTranslation } from 'react-i18next';
import { ProjectConfigForm } from '@renderer/pages/project';
import {
    IGRPButtonPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardPrimitive,
    IGRPCardDescriptionPrimitive,
    IGRPCardContentPrimitive,
    IGRPLabelPrimitive,
    IGRPCardTitlePrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsTriggerPrimitive,
    IGRPTabsContentPrimitive,
    IGRPTabsPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import useStudioAPI from '@renderer/hooks/use-studio-api';
import { IGRPInputText } from '@igrp/igrp-framework-react-design-system';
import {
    Check,
    Copy,
    GitBranch,
    GitBranchIcon,
    Package,
    Server,
} from 'lucide-react';
import { SpringConfigData } from 'src/main/types';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { useGit } from '@renderer/hooks/use-git';
import Dependency from '@renderer/pages/workspaces/components/dependency';
import { useSelector } from 'react-redux';
import { RootState } from '@renderer/redux';
import { GitContributors } from '@renderer/components/git/git-contributors';
import { FrameworkIcon } from '@renderer/components/framework-icon';
import { VersionAlert } from '@renderer/components/version-alert';
import { springEngineChangelog } from '@renderer/components/version-alert-resume';

const Overview = () => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [projectId, setProjectId] = useState<string>('');
    const [repositoryUrl, setRepositoruUrl] = useState<string | null>(null);
    const { getRemoteUrl } = useGit();

    const { isGitEnabled, activeBranch } = useSelector(
        (state: RootState) => state.git
    );

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
        setData(config);
    }, [project]);

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
                    newStats[name as keyof typeof newStats] +=
                        children?.length || 0;
                }
            });
        });

        setStats(newStats);
    }, [filesThree]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        saveOrOpenProject({ project: { ...project, config: data } });
    };

    return (
        <div className="w-full mx-auto space-y-8 p-6">
            <IGRPTabsPrimitive defaultValue="overview" className="compact-tabs">
                <IGRPTabsListPrimitive className="mb-3">
                    <IGRPTabsTriggerPrimitive
                        value="overview"
                        className="text-xs"
                    >
                        {t('overview')}
                    </IGRPTabsTriggerPrimitive>
                    <IGRPTabsTriggerPrimitive
                        value="settings"
                        className="text-xs"
                    >
                        {t('settings')}
                    </IGRPTabsTriggerPrimitive>
                </IGRPTabsListPrimitive>
                <IGRPTabsContentPrimitive
                    value="overview"
                    className="mt-0 space-y-4"
                >
                    {project && (
                        <>
                            <div className="space-x-3 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <FrameworkIcon
                                        framework={project.framework as any}
                                        size={16}
                                        className="w-10 h-10 bg-muted rounded-lg shadow-lg p-2"
                                        alt={`${project.framework} logo`}
                                    />
                                    <div>
                                        <h1 className="text-2xl font-semibold">
                                            {t('projectDetails')}
                                        </h1>
                                    </div>
                                </div>
                            </div>

                            <VersionAlert
                                projectVersion={config?.version}
                                className="mb-4"
                                changelogContent={springEngineChangelog}
                            />

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-5 rounded-lg border">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-base font-medium">
                                            {t('projectInfo')}
                                        </h3>
                                        <Package className="text-blue-400 w-5 h-5" />
                                    </div>
                                    {project && (
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-muted-foreground text-xs mb-1">
                                                    {t('name')}
                                                </p>
                                                <p className="truncate">
                                                    {project.config?.name}
                                                </p>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">
                                                    {t('type')}
                                                </div>
                                                <div className="text-sm font-medium capitalize">
                                                    {project.type}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground text-xs mb-1">
                                                    {t('version')}
                                                </p>
                                                <p className="">1.0.0</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 rounded-lg border space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-base font-medium">
                                            {t('technicalStack')}
                                        </h3>
                                        <Server className="text-purple-400 w-5 h-5" />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-muted-foreground text-xs mb-1">
                                                {t('framework')}
                                            </p>
                                            <p className="">
                                                {project.framework}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground   text-xs mb-1">
                                                {t('version')}
                                            </p>
                                            <p className="">
                                                {
                                                    project.config
                                                        ?.springBootVersion
                                                }
                                            </p>
                                        </div>
                                        <Dependency
                                            dependsOn={
                                                project?.service?.dependsOn
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="p-6 rounded-lg border space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-base font-medium">
                                            {t('development')}
                                        </h3>
                                        <GitBranchIcon className="text-green-400 w-5 h-5" />
                                    </div>
                                    <div className="space-y-4">
                                        {isGitEnabled && (
                                            <div>
                                                <p className="text-muted-foreground text-xs mb-1">
                                                    {t('repository')}
                                                </p>
                                                <p className="">
                                                    {activeBranch}
                                                </p>
                                            </div>
                                        )}
                                        {repositoryUrl && (
                                            <div>
                                                <div className="text-muted-foreground text-xs">
                                                    {t('repository')}
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
                                        <GitContributors
                                            projectPath={basePath}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DashboardOverview stats={stats} />
                        </>
                    )}
                </IGRPTabsContentPrimitive>
                <IGRPTabsContentPrimitive
                    value="settings"
                    className="mt-0 space-y-4"
                >
                    <IGRPCardPrimitive>
                        <IGRPCardHeaderPrimitive className="compact-card-header">
                            <IGRPCardTitlePrimitive className="text-sm">
                                {t('projectSettings')}
                            </IGRPCardTitlePrimitive>
                            <IGRPCardDescriptionPrimitive className="text-xs">
                                {t('configureProjectSettings')}
                            </IGRPCardDescriptionPrimitive>
                        </IGRPCardHeaderPrimitive>
                        <IGRPCardContentPrimitive className="compact-card-content space-y-3">
                            {projectId && (
                                <div className="space-y-2">
                                    <IGRPLabelPrimitive htmlFor="project-id">
                                        {t('projectId')}
                                    </IGRPLabelPrimitive>
                                    <div className="flex space-x-2">
                                        <IGRPInputText
                                            id="project-id"
                                            value={projectId}
                                            readOnly
                                            className="h-8 font-mono bg-muted/50 flex-1 rounded-r-none"
                                        />
                                        <IGRPButtonPrimitive
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
                                        </IGRPButtonPrimitive>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        {t('projectIdDescription')}
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
                                <IGRPButtonPrimitive onClick={handleSave}>
                                    {t('saveSettings')}
                                </IGRPButtonPrimitive>
                            </div>
                        </IGRPCardContentPrimitive>
                    </IGRPCardPrimitive>
                </IGRPTabsContentPrimitive>
            </IGRPTabsPrimitive>
        </div>
    );
};

export default Overview;
