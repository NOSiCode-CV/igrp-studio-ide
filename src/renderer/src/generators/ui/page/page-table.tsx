import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import { Badge } from '@renderer/components/ui/badge';
import { ChevronDown, ChevronRight, FileText, Component } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@renderer/components/ui/table';
import { PageTypeIcon, PageActionMenu } from './page-actions';
import { PageDefinition } from './page-manager';

interface PageTableProps {
    tableData: PageDefinition[];
    components: any[];
    getPageComponent: (pageName: string) => PageDefinition[];
    getSubPages: (pageName: string) => PageDefinition[];
    handleDeletePage: (page: PageDefinition) => void;
    handleAddComponents: (page: PageDefinition) => void;
    openDialogNewPage: (page?: PageDefinition) => void;
    handleDuplicate: (page: PageDefinition) => void;
}

export const PageTable = ({
    tableData,
    components,
    getPageComponent,
    getSubPages,
    handleDeletePage,
    handleAddComponents,
    openDialogNewPage,
    handleDuplicate,
}: PageTableProps) => {
    const { t } = useTranslation();
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRowExpansion = (pageName: string) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(pageName)) {
            newExpandedRows.delete(pageName);
        } else {
            newExpandedRows.add(pageName);
        }
        setExpandedRows(newExpandedRows);
    };

    const canExpand = (page: PageDefinition) => {
        const pageComponents = getPageComponent(page.pageName);
        const pageSubPages = getSubPages(page.pageName);
        return pageComponents.length > 0 || pageSubPages.length > 0;
    };

    const isExpanded = (pageName: string) => expandedRows.has(pageName);

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Subpages/Components</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tableData.map((page) => {
                        const pageComponents = getPageComponent(page.pageName);
                        const pageSubPages = getSubPages(page.pageName);
                        const hasChildren = canExpand(page);
                        const expanded = isExpanded(page.pageName);

                        return (
                            <>
                                <TableRow key={page.id}>
                                    <TableCell>
                                        {hasChildren && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleRowExpansion(page.pageName)}
                                                className="h-6 w-6 p-0"
                                            >
                                                {expanded ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <PageTypeIcon
                                                isOpen={false}
                                                compCount={components ? components.length : 0}
                                                page={page}
                                            />
                                            <span>
                                                {page.description || page.pageName}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                            {page.pagePath || '-'}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={page.isPage ? 'default' : 'secondary'}
                                            className="text-xs"
                                        >
                                            {page.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {pageComponents.length > 0 || pageSubPages.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            Components:
                                                        </span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {pageComponents.length}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            Subpages:
                                                        </span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {pageSubPages.length}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    -
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <PageActionMenu
                                            page={page}
                                            onEdit={() => void 0}
                                            onDelete={() => handleDeletePage(page)}
                                            onAddComponents={() => handleAddComponents(page)}
                                            openDialogNewPage={openDialogNewPage}
                                            onDuplicate={handleDuplicate}
                                        />
                                    </TableCell>
                                </TableRow>

                                {/* Components as table rows */}
                                {expanded && pageComponents.map((comp, index) => (
                                    <TableRow key={`comp-${page.id}-${index}`} className="bg-muted/30">
                                        <TableCell></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 pl-6">
                                                <Component className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm text-muted-foreground">
                                                    {comp.description || comp.pageName}
                                                </span>
                                                <Badge variant="outline" className="text-xs">
                                                    component
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                                {comp.pagePath || '-'}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                component
                                            </Badge>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell>
                                            <PageActionMenu
                                                page={comp}
                                                onEdit={() => void 0}
                                                onDelete={() => handleDeletePage(comp)}
                                                onAddComponents={() => handleAddComponents(comp)}
                                                openDialogNewPage={openDialogNewPage}
                                                onDuplicate={handleDuplicate}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {/* Subpages as table rows */}
                                {expanded && pageSubPages.map((subPage, index) => (
                                    <TableRow key={`subpage-${page.id}-${index}`} className="bg-muted/30">
                                        <TableCell></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 pl-6">
                                                <FileText className="h-4 w-4 text-green-500" />
                                                <span className="text-sm text-muted-foreground">
                                                    {subPage.description || subPage.pageName}
                                                </span>
                                                <Badge variant="outline" className="text-xs">
                                                    subpage
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                                {subPage.pagePath || '-'}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                subpage
                                            </Badge>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell>
                                            <PageActionMenu
                                                page={subPage}
                                                onEdit={() => void 0}
                                                onDelete={() => handleDeletePage(subPage)}
                                                onAddComponents={() => handleAddComponents(subPage)}
                                                openDialogNewPage={openDialogNewPage}
                                                onDuplicate={handleDuplicate}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};
