import { useState, useEffect } from 'react';
import { GitCommit, GitBranch, RefreshCw, AlertTriangle } from 'lucide-react';
import { useGit } from '@renderer/hooks/useGit';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface Commit {
    hash: string;
    author: string;
    date: string;
    message: string;
    branch?: string;
}

interface GitCommitsSidebarProps {
    basePath: string;
    onSelectCommit?: (commit: Commit) => void;
}

interface CommitItemProps {
    commit: Commit;
    isSelected: boolean;
    onSelect: () => void;
}

export function GitCommitsSidebar({
    basePath,
    onSelectCommit,
}: GitCommitsSidebarProps) {
    const { listCommits } = useGit();
    const [commits, setCommits] = useState<Commit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);

    const fetchCommits = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedCommits = await listCommits(basePath);
            setCommits(fetchedCommits);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch commits');
            setCommits([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommits();
    }, [basePath]);

    const handleCommitSelect = (commit: Commit) => {
        setSelectedCommit(commit);
        onSelectCommit?.(commit);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">Loading commits...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4 text-destructive">
                    <AlertTriangle className="h-6 w-6 mb-2" />
                    <p className="text-center">{error}</p>
                    <Button
                        variant="outline" 
                        className="mt-4"
                        onClick={fetchCommits}
                    >
                        Retry
                    </Button>
                </div>
            );
        }

        if (commits.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4">
                    <GitCommit className="h-6 w-6 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No commits found</p>
                </div>
            );
        }

        return (
            <ScrollArea className="h-[calc(100vh-200px)]">
                <TooltipProvider>
                    {commits.map((commit) => (
                        <CommitItem
                            key={commit.hash}
                            commit={commit}
                            isSelected={selectedCommit?.hash === commit.hash}
                            onSelect={() => handleCommitSelect(commit)}
                        />
                    ))}
                </TooltipProvider>
            </ScrollArea>
        );
    };

    return (
        <div className="w-full h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Git Commits
                </CardTitle>
                {!loading && !error && (
                    <Badge variant="secondary">
                        {commits.length} Commits
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="p-0">
                {renderContent()}
            </CardContent>
        </div>
    );
}

function CommitItem({ commit, isSelected, onSelect }: CommitItemProps) {

    return (
        <div
            className={`
                flex flex-col p-3 border-b hover:bg-accent/50 cursor-pointer 
                ${isSelected ? 'bg-accent/50' : ''}
            `}
            onClick={onSelect}
        >
            <div className="flex justify-between items-center">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                            <GitCommit className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-normal truncate max-w-[180px]">
                                {commit.message}
                            </span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{commit.message}</p>
                    </TooltipContent>
                </Tooltip>
                <Badge variant="outline" className="text-xs">
                    {commit.hash.slice(0, 7)}
                </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                <span>{commit.author}</span>
                <span>{commit.date}</span>
            </div>
        </div>
    );
}
