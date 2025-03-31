import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectData } from 'src/main/types';
import { projectIcons } from '@renderer/constants/appConstants';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import {
    Calendar,
    Clock,
    FolderOpen,
    LayoutDashboard,
    Search,
} from 'lucide-react';
import { LoadingSpinner } from '@renderer/components/loading-spinner';
import { EmptyState } from '@renderer/components/empty-state';
import { Button } from '@renderer/components/ui/button';
import { formatDistance } from 'date-fns';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { Input } from '@renderer/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@renderer/components/ui/select';
import { IGRPContainer } from '@igrp/igrp-framework-react-design-system';
import GitProject from '@renderer/components/git/git-project';
import { ProjectDropdown } from './project-dropdown';
import { enUS, pt } from 'date-fns/locale';
import { useWorkspace } from '@renderer/hooks/use-workspace';

const RecentsProjects = () => {
    const [isDelete, setIdDelete] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    const {
        workspace,
        actions: { saveOrOpenProject, findAllProjects },
    } = useWorkspace();

    const { i18n } = useTranslation();

    const { t } = useTranslation();

    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('local');

    const [allProjects, setProjects] = useState<ProjectData[]>([]);

    const [projectOrder] = useState<string>('lastModified');
    const [localProjectOrder, setLocalProjectOrder] =
        useState<string>('lastModified');

    useEffect(() => {
        fetchProjects();
    }, [workspace]);

    useEffect(() => {
        if (isDelete) fetchProjects();
    }, [isDelete]);

    useEffect(() => {
        setTimeout(() => setIsLoading(false), 1000);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();

            // Update date only if the day changes
            if (now.getDate() !== currentDate.getDate()) {
                setCurrentDate(now);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [currentDate]);

    const sortProjects = (projects) => {
        return [...projects].sort((a, b) => {
            if (projectOrder === 'name') {
                return a.name.localeCompare(b.name);
            } else if (projectOrder === 'lastModified') {
                return (
                    new Date(b.lastModified).getTime() -
                    new Date(a.lastModified).getTime()
                );
            }
            return 0;
        });
    };

    const fetchProjects = async () => {
        await findAllProjects().then((data) => {
            setProjects(data);
        });
    };

    const handleOpenProject = async (p: ProjectData): Promise<void> => {
        saveOrOpenProject(p);
    };

    // Dynamically set the locale based on the current language in i18n
    const getLocale = () => {
        switch (i18n.language) {
            case 'pt':
                return pt;
            default:
                return enUS;
        }
    };

    const RenderProjectCard = (
        project: ProjectData,
        isCompact: boolean = false,
        index: number
    ) => {
        return (
            <Card
                key={index}
                className={`flex flex-col ${isCompact ? 'p-2' : ''}`}
            >
                <CardHeader className={isCompact ? 'p-2' : ''}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {project.icon ? (
                                <img
                                    src={project.icon}
                                    alt="Project icon"
                                    width={isCompact ? 16 : 20}
                                    height={isCompact ? 16 : 20}
                                    className="mr-2 rounded-full" 
                                />
                            ) : projectIcons[project.framework] ? (
                                <img
                                    src={projectIcons[project.framework]}
                                    alt={`${project.framework} logo`}
                                    width={isCompact ? 16 : 20}
                                    height={isCompact ? 16 : 20}
                                    className="mr-2"
                                />
                            ) : null}
                            <CardTitle
                                className={`${isCompact ? 'text-sm' : 'text-lg'}`}
                            >
                                {project.name}
                            </CardTitle>
                        </div>
                        <ProjectDropdown
                            project={project}
                            onDelete={(success) => setIdDelete(success)}
                        />
                    </div>
                </CardHeader>
                <CardContent className={`grow ${isCompact ? 'p-2' : ''}`}>
                    {project.config?.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                            {project.config.description}
                        </p>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground">
                        {project.updatedAt && (
                            <>
                                <Calendar className="w-3 h-3 mr-1" />
                                <span>
                                    {t('lastModified')}:{' '}
                                    {formatDistance(
                                        project.updatedAt,
                                        currentDate,
                                        { addSuffix: true, locale: getLocale() }
                                    )}
                                </span>
                            </>
                        )}
                    </div>
                </CardContent>
                <CardContent className={`pt-0 ${isCompact ? 'p-2' : ''}`}>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenProject(project)}
                    >
                        <FolderOpen className="w-3 h-3 mr-1" />
                        <span className="text-xs">{t('open')}</span>
                    </Button>
                </CardContent>
            </Card>
        );
    };

    return (
        <>
            <IGRPContainer>
                <div className="flex items-center text-foreground">
                    <Clock className="w-5 h-5 mr-2" />
                    {t('recent')}
                </div>
                {isLoading ? (
                    <LoadingSpinner />
                ) : allProjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {allProjects
                            ?.slice(0, 3)
                            .map((project, index) =>
                                RenderProjectCard(project, true, index)
                            )}
                    </div>
                ) : (
                    <EmptyState
                        message={t('noRecentProjects')}
                        className="text-muted-foreground"
                    />
                )}
            </IGRPContainer>
            {/* All Projects Section */}
            <IGRPContainer>
                <div className="flex justify-between items-center">
                    <div className="flex items-center text-foreground">
                        <LayoutDashboard className="w-5 h-5 mr-2" />
                        {t('allProjects')}
                    </div>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger
                                value="local"
                                className="data-[state=active]:bg-background data-[state=active]:text-foreground"
                            >
                                {t('localProjects')}
                            </TabsTrigger>
                            <TabsTrigger
                                value="remote"
                                className="data-[state=active]:bg-background data-[state=active]:text-foreground"
                            >
                                {t('remoteProjects')}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsContent value="local">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5" />
                                <Input
                                    type="text"
                                    placeholder={t('searchLocalProjects')}
                                    value={localSearchQuery}
                                    onChange={(e) =>
                                        setLocalSearchQuery(e.target.value)
                                    }
                                    className="pl-8 placeholder-muted-foreground"
                                />
                            </div>
                            <Select
                                value={localProjectOrder}
                                onValueChange={setLocalProjectOrder}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder={t('orderBy')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lastModified">
                                        {t('lastModified')}
                                    </SelectItem>
                                    <SelectItem value="name">
                                        {t('name')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {isLoading ? (
                            <LoadingSpinner />
                        ) : allProjects.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sortProjects(
                                    allProjects.filter((project) =>
                                        project?.name
                                            ?.toLowerCase()
                                            .includes(
                                                localSearchQuery?.toLowerCase()
                                            )
                                    )
                                ).map((project, index) =>
                                    RenderProjectCard(project, true, index)
                                )}
                            </div>
                        ) : (
                            <EmptyState
                                message={t('noLocalProjects')}
                                className="text-muted-foreground"
                            />
                        )}
                    </TabsContent>
                    <TabsContent value="remote">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="flex-1 relative">
                                <Input
                                    type="text"
                                    placeholder={t('searchRemoteProjects')}
                                    className="pl-8 placeholder-muted-foreground"
                                />
                            </div>
                            <Select>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder={t('orderBy')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lastModified">
                                        {t('lastModified')}
                                    </SelectItem>
                                    <SelectItem value="name">
                                        {t('name')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <GitProject />
                    </TabsContent>
                </Tabs>
            </IGRPContainer>
        </>
    );
};

export default RecentsProjects;
