import { useEffect, useState } from 'react';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';

export function GitContributors({ projectPath }: { projectPath: string }) {
    const [contributors, setContributors] = useState<
        { name: string; email: string }[]
    >([]);

    useEffect(() => {
        async function loadData() {
            const data = await window.electron.ipcRenderer.invoke(
                'get-contributors-git',
                projectPath
            );
            setContributors(data);
        }
        if (projectPath) loadData();
    }, [projectPath]);

    return (
        <div>
            <p className="text-muted-foreground text-xs mb-1">Contributors</p>
            <div className="flex -space-x-2 mt-1">
                <TooltipProvider>
                    {contributors.slice(0, 3).map((contributor, i) => (
                        <Tooltip key={i}>
                            <TooltipTrigger asChild>
                                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium border-1">
                                    {contributor.name.charAt(0).toUpperCase()} 
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{contributor.name}</p>
                                <p className="text-foreground text-xs">
                                    {contributor.email}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>
        </div>
    );
}
