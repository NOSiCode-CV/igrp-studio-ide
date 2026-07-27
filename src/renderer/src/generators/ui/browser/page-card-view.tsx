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
        <Card className={browserCardClassName('gap-0 py-4')}>
            <CardContent className="group px-4">
                <Collapsible
                    className="flex w-full flex-col gap-2 group/collapsible"
                    open={isOpen}
                    onOpenChange={setIsOpen}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-start">
                            {hasChild && (
                                <CollapsibleTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="mr-1 h-5 w-5 shrink-0 p-0 text-slate-400 hover:text-emerald-400"
                                    >
                                        <ChevronRight
                                            className={cn(
                                                'transition-transform group-data-[state=open]/collapsible:rotate-90',
                                                'text-slate-500 group-hover:text-emerald-400'
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
                                <div className="min-w-0 flex-1">
                                    <div className="break-words text-sm font-medium text-slate-100">
                                        {description || pageName}
                                    </div>
                                    <div className="break-all font-mono text-xs text-slate-400">
                                        /{pagePath}
                                        {!isPage && 'components'}
                                    </div>
                                    {page.modifiedAt ? (
                                        <div className="text-[11px] text-slate-500">
                                            {formatFileDate(page.modifiedAt)}
                                        </div>
                                    ) : null}
                                    {subPages && subPages.length > 0 && (
                                        <span className="pr-2 text-xs font-medium text-emerald-400/80">
                                            {subPages.length} page
                                            {subPages.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    {components && components.length > 0 && (
                                        <span className="text-xs font-medium text-emerald-400/80">
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
                                <Separator className="bg-slate-800/60" />
                                <div className="mb-1 flex items-center gap-1 text-xs font-medium text-emerald-400/80">
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
                                        className="flex items-center justify-between rounded p-1 text-xs hover:bg-slate-800/60"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-1">
                                            <span className="truncate text-slate-200">
                                                {subpage.description || subpage.pageName}
                                            </span>
                                            <span className="truncate text-slate-500">
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
                                <Separator className="bg-slate-800/60" />
                                <div className="mb-1 flex items-center gap-1 text-xs font-medium text-emerald-400/80">
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
                                        className="flex items-center justify-between rounded p-1 text-xs hover:bg-slate-800/60"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-1">
                                            <span className="truncate text-slate-200">
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
