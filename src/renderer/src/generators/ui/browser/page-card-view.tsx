// page-card-view.tsx
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from '@renderer/components/ui/collapsible'
import { Separator } from '@renderer/components/ui/separator'
import {
    PageActionMenu,
    PageTypeIcon
} from '@renderer/generators/ui/browser/components/page-actions'
import { cn } from '@renderer/lib/utils'
import { formatFileDate } from '@renderer/utils'
import { ChevronRight, ComponentIcon } from 'lucide-react'
import { useState } from 'react'
import type { PageDefinition } from './page-manager'

export interface PageCardProps {
    page: PageDefinition
    components?: PageDefinition[]
    subPages?: PageDefinition[]
    onDelete: (page: any) => void
    onEdit: (page: any) => void
    onAddComponents: (page: PageDefinition) => void
    openDialogNewPage?: (page: PageDefinition, isSubPage?: boolean) => void
    onDuplicate?: (page: PageDefinition) => void
    onCreateScopedComponent?: (page: PageDefinition) => void
    onMove?: (page: PageDefinition) => void
    setIsSubPage: (isSubPage: boolean) => void
}

export function PageCardView({
    page,
    components,
    onDelete,
    onEdit,
    onAddComponents,
    openDialogNewPage,
    subPages,
    onDuplicate,
    onCreateScopedComponent,
    onMove,
    setIsSubPage
}: PageCardProps) {
    const { isPage, description, pageName, pagePath } = page
    const [isOpen, setIsOpen] = useState(false)

    const hasChild = (components && components.length > 0) || (subPages && subPages.length > 0)

    return (
        <Card className="">
            <CardContent className="group">
                <Collapsible
                    className="flex w-full flex-col gap-2 group/collapsible"
                    open={isOpen}
                    onOpenChange={setIsOpen}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start min-w-0 flex-1">
                            {hasChild && (
                                <CollapsibleTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 p-0 mr-1 shrink-0"
                                    >
                                        <ChevronRight
                                            className={cn(
                                                'transition-transform group-data-[state=open]/collapsible:rotate-90',
                                                'text-purple-600'
                                            )}
                                        />
                                        <span className="sr-only">Toggle</span>
                                    </Button>
                                </CollapsibleTrigger>
                            )}
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                <div className="flex items-center gap-1 shrink-0">
                                    <PageTypeIcon
                                        isOpen={isOpen}
                                        compCount={components ? components.length : 0}
                                        page={page}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm break-words">
                                        {description || pageName}
                                    </div>
                                    <div className="text-xs text-muted-foreground break-all">
                                        /{pagePath}
                                        {!isPage && 'components'}
                                    </div>
                                    {page.modifiedAt ? (
                                        <div className="text-xs text-muted-foreground">
                                            {formatFileDate(page.modifiedAt)}
                                        </div>
                                    ) : null}
                                    {/* Show counts */}{' '}
                                    {subPages && subPages.length > 0 && (
                                        <span className="text-xs text-purple-600 font-medium pr-2">
                                            {subPages.length} page
                                            {subPages.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    {components && components.length > 0 && (
                                        <span className="text-xs text-purple-600 font-medium">
                                            {components.length} component
                                            {components.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/** Main page */}
                        <div className="flex shrink-0 items-center justify-end">
                            <div className="flex items-center gap-1 justify-end">
                                <Badge
                                    variant={page.type === 'page' ? 'default' : 'secondary'}
                                    className="text-xs h-5"
                                >
                                    {page.type === 'page' ? 'P' : 'C'}
                                </Badge>
                                <PageActionMenu
                                    page={page}
                                    onEdit={() => onEdit(page)}
                                    onDelete={() => onDelete(page)}
                                    onAddComponents={onAddComponents}
                                    openDialogNewPage={openDialogNewPage}
                                    onDuplicate={onDuplicate}
                                    onCreateScopedComponent={onCreateScopedComponent}
                                    onMove={onMove}
                                    setIsSubPage={setIsSubPage}
                                />
                            </div>
                        </div>
                    </div>
                    <CollapsibleContent className="flex flex-col gap-2">
                        {subPages && subPages.length > 0 && (
                            <>
                                <Separator />

                                <div className="text-xs font-medium text-purple-600 mb-1 flex items-center gap-1">
                                    <ComponentIcon className="h-3 w-3" />
                                    Pages
                                </div>
                            </>
                        )}

                        {/* subpages */}
                        {subPages && subPages.length > 0 && (
                            <div className="space-y-1">
                                {subPages.map((subpage) => (
                                    <div
                                        key={subpage.name}
                                        className="flex items-center justify-between text-xs p-1 rounded hover:bg-muted"
                                    >
                                        <div className="flex items-center gap-1 flex-1 min-w-0">
                                            <span className="truncate">
                                                {subpage.description || subpage.pageName}
                                            </span>
                                            <span className="truncate text-muted-foreground">
                                                [{subpage.content?.path}]
                                            </span>
                                        </div>
                                        <PageActionMenu
                                            page={subpage}
                                            onEdit={() => onEdit(subpage)}
                                            onDelete={() => onDelete(subpage)}
                                            onAddComponents={onAddComponents}
                                            onDuplicate={onDuplicate}
                                            setIsSubPage={setIsSubPage}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {components && components.length > 0 && (
                            <>
                                <Separator />
                                <div className="text-xs font-medium text-purple-600 mb-1 flex items-center gap-1">
                                    <ComponentIcon className="h-3 w-3" />
                                    Components
                                </div>
                            </>
                        )}
                        {/* Subcomponents */}
                        {components && components.length > 0 && (
                            <div className="space-y-1">
                                {components.map((subpage) => (
                                    <div
                                        key={subpage.name}
                                        className="flex items-center justify-between text-xs p-1 rounded hover:bg-muted"
                                    >
                                        <div className="flex items-center gap-1 flex-1 min-w-0">
                                            <span className="truncate">
                                                {subpage.description || subpage.pageName}
                                            </span>
                                        </div>
                                        <PageActionMenu
                                            page={subpage}
                                            onDelete={() => onDelete(subpage)}
                                            onEdit={() => onEdit(subpage)}
                                            onAddComponents={onAddComponents}
                                            onDuplicate={onDuplicate}
                                            setIsSubPage={setIsSubPage}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    )
}
