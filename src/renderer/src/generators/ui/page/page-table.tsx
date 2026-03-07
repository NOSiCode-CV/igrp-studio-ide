import {
    IGRPBadgePrimitive,
    IGRPButtonPrimitive,
    IGRPTableBodyPrimitive,
    IGRPTableCellPrimitive,
    IGRPTableHeaderPrimitive,
    IGRPTableHeadPrimitive,
    IGRPTablePrimitive,
    IGRPTableRowPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { PageActionMenu, PageTypeIcon } from '@renderer/generators/ui/page/components/page-actions'
import { ChevronDown, ChevronRight, Component, FileText } from 'lucide-react'
import React, { useState } from 'react'
import type { PageDefinition } from './page-manager'

interface PageTableProps {
    tableData: PageDefinition[]
    components: any[]
    getPageComponent: (pageName: string) => PageDefinition[]
    getSubPages: (pageName: string) => PageDefinition[]
    handleDeletePage: (page: PageDefinition) => void
    handleAddComponents: (page: PageDefinition) => void
    openDialogNewPage: (page?: PageDefinition) => void
    handleDuplicate: (page: PageDefinition) => void
    setIsSubPage: (isSubPage: boolean) => void
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
    setIsSubPage
}: PageTableProps) => {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    const toggleRowExpansion = (pageName: string) => {
        const newExpandedRows = new Set(expandedRows)
        if (newExpandedRows.has(pageName)) {
            newExpandedRows.delete(pageName)
        } else {
            newExpandedRows.add(pageName)
        }
        setExpandedRows(newExpandedRows)
    }

    const canExpand = (page: PageDefinition) => {
        const pageComponents = getPageComponent(page.pageName)
        const pageSubPages = getSubPages(page.pageName)
        return pageComponents.length > 0 || pageSubPages.length > 0
    }

    const isExpanded = (pageName: string) => expandedRows.has(pageName)

    return (
        <div className="rounded-md border">
            <IGRPTablePrimitive>
                <IGRPTableHeaderPrimitive>
                    <IGRPTableRowPrimitive>
                        <IGRPTableHeadPrimitive className="w-12"></IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive>Name</IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive>Path</IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive>Type</IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive>Subpages/Components</IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive>Actions</IGRPTableHeadPrimitive>
                    </IGRPTableRowPrimitive>
                </IGRPTableHeaderPrimitive>
                <IGRPTableBodyPrimitive>
                    {tableData.map((page, index) => {
                        const pageComponents = getPageComponent(page.pageName)
                        const pageSubPages = getSubPages(page.pageName)
                        const hasChildren = canExpand(page)
                        const expanded = isExpanded(page.pageName)

                        return (
                            <React.Fragment key={index}>
                                <IGRPTableRowPrimitive>
                                    <IGRPTableCellPrimitive>
                                        {hasChildren && (
                                            <IGRPButtonPrimitive
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
                                            </IGRPButtonPrimitive>
                                        )}
                                    </IGRPTableCellPrimitive>
                                    <IGRPTableCellPrimitive>
                                        <div className="flex items-center gap-2">
                                            <PageTypeIcon
                                                isOpen={false}
                                                compCount={components ? components.length : 0}
                                                page={page}
                                            />
                                            <span>{page.description || page.pageName}</span>
                                        </div>
                                    </IGRPTableCellPrimitive>
                                    <IGRPTableCellPrimitive>
                                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                            {page.pagePath || '-'}
                                        </code>
                                    </IGRPTableCellPrimitive>
                                    <IGRPTableCellPrimitive>
                                        <IGRPBadgePrimitive
                                            variant={page.isPage ? 'default' : 'secondary'}
                                            className="text-xs"
                                        >
                                            {page.type}
                                        </IGRPBadgePrimitive>
                                    </IGRPTableCellPrimitive>
                                    <IGRPTableCellPrimitive>
                                        <div className="flex gap-2">
                                            {pageComponents.length > 0 ||
                                            pageSubPages.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            Components:
                                                        </span>
                                                        <IGRPBadgePrimitive
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {pageComponents.length}
                                                        </IGRPBadgePrimitive>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            Subpages:
                                                        </span>
                                                        <IGRPBadgePrimitive
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {pageSubPages.length}
                                                        </IGRPBadgePrimitive>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    -
                                                </span>
                                            )}
                                        </div>
                                    </IGRPTableCellPrimitive>
                                    <IGRPTableCellPrimitive>
                                        <PageActionMenu
                                            page={page}
                                            onEdit={() => void 0}
                                            onDelete={() => handleDeletePage(page)}
                                            onAddComponents={() => handleAddComponents(page)}
                                            openDialogNewPage={openDialogNewPage}
                                            onDuplicate={handleDuplicate}
                                            setIsSubPage={setIsSubPage}
                                        />
                                    </IGRPTableCellPrimitive>
                                </IGRPTableRowPrimitive>

                                {/* Components as table rows */}
                                {expanded &&
                                    pageComponents.map((comp, index) => (
                                        <IGRPTableRowPrimitive
                                            key={`comp-${page.id}-${index}`}
                                            className="bg-muted/30"
                                        >
                                            <IGRPTableCellPrimitive></IGRPTableCellPrimitive>
                                            <IGRPTableCellPrimitive>
                                                <div className="flex items-center gap-2 pl-6">
                                                    <Component className="h-4 w-4 text-blue-500" />
                                                    <span className="text-sm text-muted-foreground">
                                                        {comp.description || comp.pageName}
                                                    </span>
                                                    <IGRPBadgePrimitive
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        component
                                                    </IGRPBadgePrimitive>
                                                </div>
                                            </IGRPTableCellPrimitive>
                                            <IGRPTableCellPrimitive>
                                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                                    {comp.pagePath || '-'}
                                                </code>
                                            </IGRPTableCellPrimitive>
                                            <IGRPTableCellPrimitive>
                                                <IGRPBadgePrimitive
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    component
                                                </IGRPBadgePrimitive>
                                            </IGRPTableCellPrimitive>
                                            <IGRPTableCellPrimitive></IGRPTableCellPrimitive>
                                            <IGRPTableCellPrimitive>
                                                <PageActionMenu
                                                    page={comp}
                                                    onEdit={() => void 0}
                                                    onDelete={() => handleDeletePage(comp)}
                                                    onAddComponents={() =>
                                                        handleAddComponents(comp)
                                                    }
                                                    openDialogNewPage={openDialogNewPage}
                                                    onDuplicate={handleDuplicate}
                                                    setIsSubPage={setIsSubPage}
                                                />
                                            </IGRPTableCellPrimitive>
                                        </IGRPTableRowPrimitive>
                                    ))}

                                {/* Subpages as table rows */}
                                {expanded &&
                                    pageSubPages.map((subPage, index) => (
                                        <IGRPTableRowPrimitive
                                            key={`subpage-${page.id}-${index}`}
                                            className="bg-muted/30"
                                        >
                                            <IGRPTableCellPrimitive></IGRPTableCellPrimitive>
                                            <IGRPTableCellPrimitive>
                                                <div className="flex items-center gap-2 pl-6">
                                                    <FileText className="h-4 w-4 text-green-500" />
                                                    <span className="text-sm text-muted-foreground">
                                                        {subPage.description || subPage.pageName}
                                                    </span>
                                                    <IGRPBadgePrimitive
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        subpage
                                                    </IGRPBadgePrimitive>
                                                </div>
                                            </IGRPTableCellPrimitive>
                                            <IGRPTableCellPrimitive>
                                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                                    {subPage.pagePath || '-'}
                                                </code>
                                            </IGRPTableCellPrimitive>
                                            <IGRPTableCellPrimitive>
                                                <IGRPBadgePrimitive
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    subpage
                                                </IGRPBadgePrimitive>
                                            </IGRPTableCellPrimitive>
                                            <IGRPTableCellPrimitive></IGRPTableCellPrimitive>
                                            <IGRPTableCellPrimitive>
                                                <PageActionMenu
                                                    page={subPage}
                                                    onEdit={() => void 0}
                                                    onDelete={() => handleDeletePage(subPage)}
                                                    onAddComponents={() =>
                                                        handleAddComponents(subPage)
                                                    }
                                                    openDialogNewPage={openDialogNewPage}
                                                    onDuplicate={handleDuplicate}
                                                    setIsSubPage={setIsSubPage}
                                                />
                                            </IGRPTableCellPrimitive>
                                        </IGRPTableRowPrimitive>
                                    ))}
                            </React.Fragment>
                        )
                    })}
                </IGRPTableBodyPrimitive>
            </IGRPTablePrimitive>
        </div>
    )
}
