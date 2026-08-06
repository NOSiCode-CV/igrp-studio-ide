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
import { browserCardClassName } from '@renderer/generators/ui/browser/browser-card-styles'
import {
    PageActionMenu,
    PageTypeIcon
} from '@renderer/generators/ui/browser/components/page-actions'
import { getRouteGroup } from '@renderer/generators/ui/components/settings/properties/route-parser'
import { cn } from '@renderer/lib/utils'
import { formatFileDate } from '@renderer/utils'
import { ChevronRight, ComponentIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
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
    defaultOpen?: boolean
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
    setIsSubPage,
    defaultOpen = false
}: PageCardProps) {
    const { isPage, description, pageName, pagePath } = page
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const routeGroup = getRouteGroup(pagePath)

    useEffect(() => {
        if (defaultOpen) setIsOpen(true)
    }, [defaultOpen])

    const hasChild = (components && components.length > 0) || (subPages && subPages.length > 0)

    return (
        <Card className={browserCardClassName('h-full gap-0 overflow-hidden py-4')}>
            <CardContent className="group px-4">
                <Collapsible
                    className="flex w-full flex-col gap-2 group/collapsible"
                    open={isOpen}
                    onOpenChange={setIsOpen}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-start overflow-hidden">
                            {hasChild && (
                                <CollapsibleTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="mr-1 h-5 w-5 shrink-0 p-0 text-muted-foreground hover:text-primary"
                                    >
                                        <ChevronRight
                                            className={cn(
                                                'transition-transform group-data-[state=open]/collapsible:rotate-90',
                                                'text-muted-foreground group-hover:text-primary'
                                            )}
                                        />
                                        <span className="sr-only">Toggle</span>
                                    </Button>
                                </CollapsibleTrigger>
                            )}
                            <div className="flex min-w-0 flex-1 items-start gap-2">
                                <div className="flex shrink-0 items-center gap-1">
                                    <PageTypeIcon
                                        isOpen={isOpen}
                                        compCount={components ? components.length : 0}
                                        page={page}
                                    />
                                </div>
                                <div className="min-w-0 flex-1 overflow-hidden">
                                    {routeGroup ? (
                                        <div className="mb-0.5 truncate font-mono text-[10px] font-medium text-primary">
                                            ({routeGroup})
                                        </div>
                                    ) : null}
                                    <div
                                        className="truncate text-sm font-medium text-foreground"
                                        title={description || pageName}
                                    >
                                        {description || pageName}
                                    </div>
                                    <div
                                        className="truncate font-mono text-xs text-muted-foreground"
                                        title={`/${pagePath}${!isPage ? 'components' : ''}`}
                                    >
                                        /{pagePath}
                                        {!isPage && 'components'}
                                    </div>
                                    {page.modifiedAt ? (
                                        <div className="truncate text-[11px] text-muted-foreground">
                                            {formatFileDate(page.modifiedAt)}
                                        </div>
                                    ) : null}
                                    {subPages && subPages.length > 0 && (
                                        <span className="pr-2 text-xs font-medium text-primary">
                                            {subPages.length} page
                                            {subPages.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    {components && components.length > 0 && (
                                        <span className="text-xs font-medium text-primary">
                                            {components.length} component
                                            {components.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center justify-end">
                            <div className="flex items-center justify-end gap-1">
                                <Badge
                                    variant={page.type === 'page' ? 'default' : 'secondary'}
                                    className="h-5 text-xs"
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
                                <div className="mb-1 flex items-center gap-1 text-xs font-medium text-primary">
                                    <ComponentIcon className="h-3 w-3" />
                                    Pages
                                </div>
                            </>
                        )}

                        {subPages && subPages.length > 0 && (
                            <div className="space-y-1">
                                {subPages.map((subpage) => (
                                    <div
                                        key={subpage.name}
                                        className="flex items-center justify-between rounded p-1 text-xs hover:bg-accent"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-1">
                                            <span className="truncate text-foreground">
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
                                <div className="mb-1 flex items-center gap-1 text-xs font-medium text-primary">
                                    <ComponentIcon className="h-3 w-3" />
                                    Components
                                </div>
                            </>
                        )}
                        {components && components.length > 0 && (
                            <div className="space-y-1">
                                {components.map((subpage) => (
                                    <div
                                        key={subpage.name}
                                        className="flex items-center justify-between rounded p-1 text-xs hover:bg-accent"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-1">
                                            <span className="truncate text-foreground">
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
