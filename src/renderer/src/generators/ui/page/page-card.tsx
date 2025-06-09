// page-card.tsx
import { Card, CardContent } from '@renderer/components/ui/card';
import { Button } from '@renderer/components/ui/button';
import { ChevronRight, ComponentIcon } from 'lucide-react';
import { PageDefinition } from './list-pages';
import { Badge } from '@renderer/components/ui/badge';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@renderer/components/ui/collapsible';
import { Separator } from '@renderer/components/ui/separator';
import { useState } from 'react';
import { cn } from '@renderer/lib/utils';
import { IconPage, PageActions } from './shared';

export interface PageCardProps {
    page: PageDefinition;
    components?: PageDefinition[];
    subPages?: PageDefinition[];
    onDelete: (page: any) => void;
    onAddComponents: (page: PageDefinition) => void;
    openDialogNewPage?: (page: PageDefinition) => void;
}

export function PageCard({
    page,
    components,
    onDelete,
    onAddComponents,
    openDialogNewPage,
    subPages,
}: PageCardProps) {
    const { isPage, description, pageName, pagePath } = page;
    const [isOpen, setIsOpen] = useState(false);

    const hasChild =
        (components && components.length > 0) ||
        (subPages && subPages.length > 0);

    return (
        <Card className="">
            <CardContent className="group">
                <Collapsible
                    className="flex w-full flex-col gap-2 group/collapsible"
                    open={isOpen}
                    onOpenChange={setIsOpen}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {hasChild && (
                                <CollapsibleTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 p-0 mr-1"
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
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <IconPage
                                        isOpen={isOpen}
                                        compCount={
                                            components ? components.length : 0
                                        }
                                        page={page}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                        {description || pageName}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        /{pagePath}
                                        {!isPage && 'components'}
                                    </div>
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
                        <div className="flex items-center justify-end">
                            <div className="flex items-center gap-1 justify-end">
                                <Badge
                                    variant={
                                        page.type === 'page'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="text-xs h-5"
                                >
                                    {page.type === 'page' ? 'P' : 'C'}
                                </Badge>
                                <PageActions
                                    page={page}
                                    onDelete={() => onDelete(page)}
                                    onAddComponents={onAddComponents}
                                    openDialogNewPage={openDialogNewPage}
                                />
                            </div>
                        </div>
                    </div>
                    <CollapsibleContent className="flex flex-col gap-2">
                        <Separator />

                        {subPages && subPages.length > 0 && (
                            <div className="text-xs font-medium text-purple-600 mb-1 flex items-center gap-1">
                                <ComponentIcon className="h-3 w-3" />
                                Pages
                            </div>
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
                                                {subpage.description ||
                                                    subpage.pageName}
                                            </span>
                                        </div>
                                        <PageActions
                                            page={subpage}
                                            onDelete={() => onDelete(subpage)}
                                            onAddComponents={onAddComponents}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        <Separator />

                        {subPages && subPages.length > 0 && (
                            <div className="text-xs font-medium text-purple-600 mb-1 flex items-center gap-1">
                                <ComponentIcon className="h-3 w-3" />
                                Components
                            </div>
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
                                                {subpage.description ||
                                                    subpage.pageName}
                                            </span>
                                        </div>
                                        <PageActions
                                            page={subpage}
                                            onDelete={() => onDelete(subpage)}
                                            onAddComponents={onAddComponents}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
}
