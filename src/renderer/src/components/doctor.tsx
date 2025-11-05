import { JSX, useEffect, useState } from 'react';
import {
    IGRPDialogPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogTitlePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { ToolCheck } from 'src/main/types';
import {
    Stethoscope,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Download,
    Globe,
    Settings,
    Wrench,
} from 'lucide-react';
import {
    IGRPTablePrimitive,
    IGRPTableBodyPrimitive,
    IGRPTableCellPrimitive,
    IGRPTableHeadPrimitive,
    IGRPTableHeaderPrimitive,
    IGRPTableRowPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPBadgePrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPCardPrimitive,
    IGRPCardContentPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardTitlePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPScrollAreaPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPTooltipPrimitive,
    IGRPTooltipTriggerPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipProviderPrimitive,
} from '@igrp/igrp-framework-react-design-system';

interface CategorySummary {
    category: 'frontend' | 'backend' | 'development';
    title: string;
    description: string;
    icon: React.ReactNode;
    tools: ToolCheck[];
    totalTools: number;
    successfulTools: number;
    requiredTools: number;
    successfulRequiredTools: number;
}

export default function Doctor({
    open,
    setOpen,
}: {
    open: boolean;
    setOpen: (prompt: boolean) => void;
}): JSX.Element {
    const [results, setResults] = useState<ToolCheck[] | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            setResults(null);
            window.api.runDoctorChecks().then((res: ToolCheck[]) => {
                setResults(res);
                setLoading(false);
            });
        }
    }, [open]);

    const allGood = results && results.every((tool) => tool.success);

    const getCategorySummary = (
        category: 'frontend' | 'backend' | 'development'
    ): CategorySummary => {
        const categoryTools =
            results?.filter((tool) => tool.category === category) || [];
        const requiredTools = categoryTools.filter((tool) => tool.required);
        const successfulRequiredTools = requiredTools.filter(
            (tool) => tool.success
        );

        return {
            category,
            title:
                category === 'frontend'
                    ? 'Frontend Development'
                    : category === 'backend'
                      ? 'Backend Development'
                      : 'Development Infrastructure',
            description:
                category === 'frontend'
                    ? 'Tools for React, Next.js, and modern web development'
                    : category === 'backend'
                      ? 'Tools for Java, Spring Boot, and .NET development'
                      : 'Essential development tools and infrastructure',
            icon:
                category === 'frontend' ? (
                    <Globe className="h-6 w-6" />
                ) : category === 'backend' ? (
                    <Settings className="h-6 w-6" />
                ) : (
                    <Wrench className="h-6 w-6" />
                ),
            tools: categoryTools,
            totalTools: categoryTools.length,
            successfulTools: categoryTools.filter((tool) => tool.success)
                .length,
            requiredTools: requiredTools.length,
            successfulRequiredTools: successfulRequiredTools.length,
        };
    };

    const getCategoryStatus = (summary: CategorySummary) => {
        if (
            summary.successfulRequiredTools === summary.requiredTools &&
            summary.requiredTools > 0
        ) {
            return {
                status: 'success',
                icon: <CheckCircle className="h-4 w-4 text-green-600" />,
                text: 'All required tools ready',
            };
        } else if (summary.successfulRequiredTools > 0) {
            return {
                status: 'partial',
                icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
                text: 'Some required tools missing',
            };
        } else {
            return {
                status: 'error',
                icon: <XCircle className="h-4 w-4 text-red-600" />,
                text: 'Required tools missing',
            };
        }
    };

    const categories: ('frontend' | 'backend' | 'development')[] = [
        'frontend',
        'backend',
        'development',
    ];

    return (
        <IGRPDialogPrimitive open={open} onOpenChange={setOpen}>
            <IGRPDialogContentPrimitive className="sm:max-w-[730px] max-w-4xl max-h-[80vh]">
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive className="flex gap-2 items-center text-xl">
                        <Stethoscope className="h-6 w-6" />
                        <span>System Health Check</span>
                    </IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                        Comprehensive check of your development environment
                        tools
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-2 text-gray-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>Running system checks...</span>
                        </div>
                    </div>
                ) : (
                    <IGRPScrollAreaPrimitive className="h-[60vh] pr-4">
                        {/* Overall Status */}
                        <div className="mb-6">
                            {allGood ? (
                                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-green-800 font-medium">
                                        All systems are healthy!
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    <span className="text-yellow-800 font-medium">
                                        Some tools are missing or not working
                                        correctly.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Category Cards */}
                        <div className="space-y-6">
                            {categories.map((category) => {
                                const summary = getCategorySummary(category);
                                const status = getCategoryStatus(summary);

                                if (summary.totalTools === 0) return null;

                                return (
                                    <IGRPCardPrimitive key={category}>
                                        <IGRPCardHeaderPrimitive className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-muted-foreground">
                                                        {summary.icon}
                                                    </div>
                                                    <div>
                                                        <IGRPCardTitlePrimitive className="text-lg">
                                                            {summary.title}
                                                        </IGRPCardTitlePrimitive>
                                                        <p className="text-sm text-muted-foreground">
                                                            {
                                                                summary.description
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {status.icon}
                                                    <IGRPBadgePrimitive
                                                        variant={
                                                            status.status ===
                                                            'success'
                                                                ? 'default'
                                                                : status.status ===
                                                                    'partial'
                                                                  ? 'secondary'
                                                                  : 'destructive'
                                                        }
                                                        className="text-xs"
                                                    >
                                                        {
                                                            summary.successfulRequiredTools
                                                        }
                                                        /{summary.requiredTools}{' '}
                                                        required
                                                    </IGRPBadgePrimitive>
                                                </div>
                                            </div>
                                        </IGRPCardHeaderPrimitive>
                                        <IGRPCardContentPrimitive className="pt-0">
                                            <IGRPTablePrimitive>
                                                <IGRPTableHeaderPrimitive>
                                                    <IGRPTableRowPrimitive>
                                                        <IGRPTableHeadPrimitive>
                                                            Tool
                                                        </IGRPTableHeadPrimitive>
                                                        <IGRPTableHeadPrimitive>
                                                            Status
                                                        </IGRPTableHeadPrimitive>
                                                        <IGRPTableHeadPrimitive>
                                                            Version / Error
                                                        </IGRPTableHeadPrimitive>
                                                        <IGRPTableHeadPrimitive>
                                                            Action
                                                        </IGRPTableHeadPrimitive>
                                                    </IGRPTableRowPrimitive>
                                                </IGRPTableHeaderPrimitive>
                                                <IGRPTableBodyPrimitive>
                                                    {summary.tools.map(
                                                        (tool, index) => (
                                                            <IGRPTableRowPrimitive
                                                                key={index}
                                                            >
                                                                <IGRPTableCellPrimitive className="py-3">
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {
                                                                                tool.name
                                                                            }
                                                                        </div>
                                                                        {tool.description && (
                                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                                {
                                                                                    tool.description
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </IGRPTableCellPrimitive>
                                                                <IGRPTableCellPrimitive className="py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        {tool.success ? (
                                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                                        ) : (
                                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                                        )}
                                                                        <span
                                                                            className={
                                                                                tool.success
                                                                                    ? 'text-green-600'
                                                                                    : 'text-red-600'
                                                                            }
                                                                        >
                                                                            {tool.success
                                                                                ? 'OK'
                                                                                : tool.required
                                                                                  ? 'Required'
                                                                                  : 'Optional'}
                                                                        </span>
                                                                    </div>
                                                                </IGRPTableCellPrimitive>
                                                                <IGRPTableCellPrimitive className="py-3 text-xs">
                                                                    {tool.success ? (
                                                                        <code className="bg-muted px-1 py-0.5 rounded text-xs">
                                                                            {
                                                                                tool.version
                                                                            }
                                                                        </code>
                                                                    ) : (
                                                                        <IGRPTooltipProviderPrimitive>
                                                                            <IGRPTooltipPrimitive>
                                                                                <IGRPTooltipTriggerPrimitive
                                                                                    asChild
                                                                                >
                                                                                    Error
                                                                                </IGRPTooltipTriggerPrimitive>
                                                                                <IGRPTooltipContentPrimitive className="max-w-md">
                                                                                    <p className="text-xs whitespace-pre-wrap">
                                                                                        {
                                                                                            tool.error
                                                                                        }
                                                                                    </p>
                                                                                </IGRPTooltipContentPrimitive>
                                                                            </IGRPTooltipPrimitive>
                                                                        </IGRPTooltipProviderPrimitive>
                                                                    )}
                                                                </IGRPTableCellPrimitive>
                                                                <IGRPTableCellPrimitive className="py-3">
                                                                    {!tool.success &&
                                                                        tool.link && (
                                                                            <a
                                                                                href={
                                                                                    tool.link
                                                                                }
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                                                                            >
                                                                                <Download className="h-3 w-3" />
                                                                                Download
                                                                            </a>
                                                                        )}
                                                                </IGRPTableCellPrimitive>
                                                            </IGRPTableRowPrimitive>
                                                        )
                                                    )}
                                                </IGRPTableBodyPrimitive>
                                            </IGRPTablePrimitive>
                                        </IGRPCardContentPrimitive>
                                    </IGRPCardPrimitive>
                                );
                            })}
                        </div>

                        {/* Summary Footer */}
                        {results && (
                            <div className="mt-6 pt-4 border-t">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>
                                        Total tools checked: {results.length} •
                                        Successful:{' '}
                                        {
                                            results.filter((t) => t.success)
                                                .length
                                        }{' '}
                                        • Required missing:{' '}
                                        {
                                            results.filter(
                                                (t) => t.required && !t.success
                                            ).length
                                        }
                                    </span>
                                    <span>
                                        Last checked:{' '}
                                        {new Date().toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </IGRPScrollAreaPrimitive>
                )}
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    );
}
