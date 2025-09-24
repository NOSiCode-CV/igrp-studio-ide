// page-card-view.tsx
import { IGRPBadgePrimitive, IGRPButtonPrimitive, IGRPCardContentPrimitive, IGRPCardPrimitive, IGRPCollapsibleContentPrimitive, IGRPCollapsiblePrimitive, IGRPCollapsibleTriggerPrimitive, IGRPSeparatorPrimitive } from '@igrp/igrp-framework-react-design-system';
import { ChevronRight, ComponentIcon } from 'lucide-react';
import { PageDefinition } from './page-manager';
import { useState } from 'react';
import { cn } from '@renderer/lib/utils';
import { PageTypeIcon, PageActionMenu } from './page-actions';

export interface PageCardProps {
    page: PageDefinition;
    components?: PageDefinition[];
    subPages?: PageDefinition[];
    onDelete: (page: any) => void;
    onEdit: (page: any) => void;
    onAddComponents: (page: PageDefinition) => void;
    openDialogNewPage?: (page: PageDefinition, isSubPage?: boolean  ) => void;
    onDuplicate?: (page: PageDefinition) => void;   
    setIsSubPage: (isSubPage: boolean) => void;
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
    setIsSubPage,
}: PageCardProps) {
    const { isPage, description, pageName, pagePath } = page;
    const [isOpen, setIsOpen] = useState(false);

    const hasChild =
        (components && components.length > 0) ||
        (subPages && subPages.length > 0);

    return (
        <IGRPCardPrimitive className="">
            <IGRPCardContentPrimitive className="group">
                <IGRPCollapsiblePrimitive
                    className="flex w-full flex-col gap-2 group/collapsible"
                    open={isOpen}
                    onOpenChange={setIsOpen}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {hasChild && (
                                <IGRPCollapsibleTriggerPrimitive asChild>
                                    <IGRPButtonPrimitive
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
                                    </IGRPButtonPrimitive>
                                </IGRPCollapsibleTriggerPrimitive>
                            )}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <PageTypeIcon
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
                                <IGRPBadgePrimitive
                                    variant={
                                        page.type === 'page'
                                            ? 'solid'
                                            : 'secondary'
                                    }
                                    className="text-xs h-5"
                                >
                                    {page.type === 'page' ? 'P' : 'C'}
                                </IGRPBadgePrimitive>
                                <PageActionMenu
                                    page={page}
                                    onEdit={() => onEdit(page)}
                                    onDelete={() => onDelete(page)}
                                    onAddComponents={onAddComponents}
                                    openDialogNewPage={openDialogNewPage}
                                    onDuplicate={onDuplicate}
                                    setIsSubPage={setIsSubPage}
                                />
                            </div>
                        </div>
                    </div>
                    <IGRPCollapsibleContentPrimitive className="flex flex-col gap-2">
                        {subPages && subPages.length > 0 && (
                            <>
                                <IGRPSeparatorPrimitive />

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
                                                {subpage.description ||
                                                    subpage.pageName}
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
                                <IGRPSeparatorPrimitive />
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
                                                {subpage.description ||
                                                    subpage.pageName}
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
                    </IGRPCollapsibleContentPrimitive>
                </IGRPCollapsiblePrimitive  >
            </IGRPCardContentPrimitive>
        </IGRPCardPrimitive>
    );
}
