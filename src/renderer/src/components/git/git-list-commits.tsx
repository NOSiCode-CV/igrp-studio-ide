import { useState, useEffect } from 'react';
import { GitCommit, GitBranch, RefreshCw, AlertTriangle } from 'lucide-react';
import { useGit } from '@renderer/hooks/use-git';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPScrollAreaPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPTooltipPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipProviderPrimitive,
    IGRPTooltipTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPCardContentPrimitive, IGRPCardHeaderPrimitive, IGRPCardTitlePrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPBadgePrimitive } from '@igrp/igrp-framework-react-design-system';
import { useTranslation } from 'react-i18next';
import { IGRPSwitchPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system';

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
    const { t } = useTranslation();
    const { listCommits, setAutoCommit, checkIsAutoCommit } = useGit();
    const [commits, setCommits] = useState<Commit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
    const [autoCommit, isAutoCommit] = useState<boolean>(true);

    const fetchCommits = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedCommits = await listCommits(basePath);
            setCommits(fetchedCommits);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : t('failedFetchCommits')
            );
            setCommits([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommits();
    }, [basePath]);

    useEffect(() => {
        const check = async () => {
            const prompt = await checkIsAutoCommit();
            isAutoCommit(prompt);
        };
        check();
    }, []);

    const handleCommitSelect = (commit: Commit) => {
        setSelectedCommit(commit);
        onSelectCommit?.(commit);
    };

    const handleAutoCommitIGRPSwitchPrimitive = (prompt: boolean) => {
        isAutoCommit(prompt);
        setAutoCommit(prompt);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">
                        {t('loadingCommits')}
                    </p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4 text-destructive">
                    <AlertTriangle className="h-6 w-6 mb-2" />
                    <p className="text-center">{error}</p>
                    <IGRPButtonPrimitive
                        variant="outline"
                        className="mt-4"
                        onClick={fetchCommits}
                    >
                        {t('retry')}
                    </IGRPButtonPrimitive>
                </div>
            );
        }

        if (commits.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4">
                    <GitCommit className="h-6 w-6 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">
                        {t('noCommitsFound')}
                    </p>
                </div>
            );
        }

        return (
            <IGRPScrollAreaPrimitive className="h-[calc(100vh-230px)]">
                <IGRPTooltipProviderPrimitive>
                    {commits.map((commit) => (
                        <CommitItem
                            key={commit.hash}
                            commit={commit}
                            isSelected={selectedCommit?.hash === commit.hash}
                            onSelect={() => handleCommitSelect(commit)}
                        />
                    ))}
                </IGRPTooltipProviderPrimitive>
            </IGRPScrollAreaPrimitive>
        );
    };

    return (
        <div className="w-full h-full">
            <IGRPCardHeaderPrimitive className="flex space-y-4 p-2">
                <div className="flex flex-1 items-center space-x-2">
                    <IGRPLabelPrimitive>Auto Commit</IGRPLabelPrimitive>
                    <IGRPSwitchPrimitive
                        checked={autoCommit}
                        onCheckedChange={(value) => {
                            handleAutoCommitIGRPSwitchPrimitive(value);
                        }}
                    ></IGRPSwitchPrimitive>
                </div>
                <div className="flex flex-row items-center justify-between">
                    <IGRPCardTitlePrimitive className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5" />
                        {t('gitCommits')}
                    </IGRPCardTitlePrimitive>
                    {!loading && !error && (
                        <IGRPBadgePrimitive variant="secondary">
                            {t('commitsCount', { count: commits.length })}
                        </IGRPBadgePrimitive>
                    )}
                </div>
            </IGRPCardHeaderPrimitive>
            <IGRPCardContentPrimitive className="p-0">{renderContent()}</IGRPCardContentPrimitive>
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
                <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive asChild>
                        <div className="flex items-center gap-2">
                            <GitCommit className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-normal truncate max-w-[180px]">
                                {commit.message}
                            </span>
                        </div>
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive>
                        <p>{commit.message}</p>
                    </IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>
                <IGRPBadgePrimitive variant="outline" className="text-xs">
                    {commit.hash.slice(0, 7)}
                </IGRPBadgePrimitive>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                <span>{commit.author}</span>
                <span>{commit.date}</span>
            </div>
        </div>
    );
}
