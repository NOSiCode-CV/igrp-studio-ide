'use client';

import { useState, useMemo, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { X } from 'lucide-react';
import { Input } from '@renderer/components/ui/input';
import { Button } from '@renderer/components/ui/button';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@renderer/components/ui/scroll-area';
import { Badge } from '@renderer/components/ui/badge';
import { lucideIconsConfig } from './data';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '../ui/accordion';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';

interface IconBrowserProps {
    onIconSelect?: (iconName: string) => void;
    initialSelectedIcon?: string | null;
    title?: string;
}

export default function IconBrowser({
    onIconSelect,
    initialSelectedIcon = null,
    title = 'Icon Lucide',
}: IconBrowserProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedIcon, setSelectedIcon] = useState<string | null>(
        initialSelectedIcon
    );

    // Update selected icon if initialSelectedIcon changes
    useEffect(() => {
        if (initialSelectedIcon !== null) {
            setSelectedIcon(initialSelectedIcon);
        }
    }, [initialSelectedIcon]);

    // Filter icons based on search query and selected category
    const filteredIcons = useMemo(() => {
        return lucideIconsConfig.icons.filter((icon) => {
            const matchesSearch = icon.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesCategory =
                selectedCategory === 'All' ||
                icon.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, selectedCategory]);

    // Group icons by category
    const iconsByCategory = useMemo(() => {
        const grouped: Record<string, typeof lucideIconsConfig.icons> = {};

        lucideIconsConfig.categories.forEach((category) => {
            grouped[category] = lucideIconsConfig.icons.filter(
                (icon) =>
                    icon.category === category &&
                    icon.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        });

        return grouped;
    }, [searchQuery]);

    // Count icons in each category after filtering
    const categoryCount = useMemo(() => {
        const counts: Record<string, number> = {};

        lucideIconsConfig.categories.forEach((category) => {
            counts[category] = lucideIconsConfig.icons.filter(
                (icon) =>
                    icon.category === category &&
                    icon.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).length;
        });

        return counts;
    }, [searchQuery]);

    const getPascalCaseName = (iconName: string) => {
        return iconName
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');
    };

    // Handle icon selection
    const handleIconSelect = (e: React.MouseEvent, iconName: string) => {
        e.preventDefault();
        setSelectedIcon(iconName);
        onIconSelect?.(getPascalCaseName(iconName));
    };

    // Clear search
    const clearSearch = () => {
        setSearchQuery('');
    };

    // Render the icon component dynamically
    const renderIcon = (iconName: string) => {
        // Convert kebab-case to PascalCase for Lucide icons
        const pascalCaseName = getPascalCaseName(iconName);

        // @ts-ignore - Dynamic access to the icons
        const IconComponent = LucideIcons[pascalCaseName];

        return IconComponent ? <IconComponent className="h-8 w-8" /> : null;
    };

    return (
        <TooltipProvider>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>{title}</AccordionTrigger>
                    <AccordionContent>
                        <div className="relative mb-6">
                            <Input
                                type="text"
                                placeholder="Search icons..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pr-10"
                            />
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-10 w-10"
                                    onClick={clearSearch}
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">
                                        Clear search
                                    </span>
                                </Button>
                            )}
                        </div>

                        <Tabs defaultValue="all" className="w-full">
                            <div className="mb-4 relative">
                                <ScrollArea
                                    className="w-full"
                                    scrollHideDelay={400}
                                >
                                    <div className="flex pb-4 pt-1 px-4 min-w-full">
                                        <TabsList className="inline-flex h-auto w-auto bg-transparent gap-2">
                                            <TabsTrigger
                                                value="all"
                                                onClick={() =>
                                                    setSelectedCategory('All')
                                                }
                                                className="px-3 py-1.5 flex-shrink-0 border bg-background hover:bg-accent"
                                            >
                                                All
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-2"
                                                >
                                                    {filteredIcons.length}
                                                </Badge>
                                            </TabsTrigger>

                                            {lucideIconsConfig.categories.map(
                                                (category) => (
                                                    <TabsTrigger
                                                        key={category}
                                                        value={category
                                                            .toLowerCase()
                                                            .replace(
                                                                /\s+/g,
                                                                '-'
                                                            )}
                                                        onClick={() =>
                                                            setSelectedCategory(
                                                                category
                                                            )
                                                        }
                                                        className="px-3 py-1.5 flex-shrink-0 border bg-background hover:bg-accent whitespace-nowrap"
                                                        disabled={
                                                            categoryCount[
                                                                category
                                                            ] === 0
                                                        }
                                                    >
                                                        {category}
                                                        <Badge
                                                            variant="secondary"
                                                            className="ml-2"
                                                        >
                                                            {
                                                                categoryCount[
                                                                    category
                                                                ]
                                                            }
                                                        </Badge>
                                                    </TabsTrigger>
                                                )
                                            )}
                                        </TabsList>
                                    </div>
                                    <ScrollBar
                                        orientation="horizontal"
                                        className="h-2.5 bg-transparent"
                                    />
                                </ScrollArea>
                            </div>

                            <div className={'overflow-y-auto max-h-[30vh]'}>
                                <TabsContent value="all" className="mt-0">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {filteredIcons.map((icon, index) => (
                                            <Tooltip key={index}>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        key={icon.name}
                                                        size={'icon'}
                                                        variant={
                                                            selectedIcon ===
                                                            icon.name
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        className={`items-center justify-center gap-2 hover:bg-accent ${
                                                            selectedIcon ===
                                                            icon.name
                                                                ? 'ring-2 ring-primary'
                                                                : ''
                                                        }`}
                                                        onClick={(e) =>
                                                            handleIconSelect(
                                                                e,
                                                                icon.name
                                                            )
                                                        }
                                                    >
                                                        {renderIcon(icon.name)}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {icon.name}
                                                </TooltipContent>
                                            </Tooltip>
                                        ))}
                                    </div>
                                </TabsContent>

                                {lucideIconsConfig.categories.map(
                                    (category) => (
                                        <TabsContent
                                            key={category}
                                            value={category
                                                .toLowerCase()
                                                .replace(/\s+/g, '-')}
                                            className="mt-0"
                                        >
                                            <div className="grid grid-cols-8 gap-4">
                                                {iconsByCategory[category]?.map(
                                                    (icon, index) => (
                                                        <Tooltip key={index}>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    key={
                                                                        icon.name
                                                                    }
                                                                    size={
                                                                        'icon'
                                                                    }
                                                                    variant={
                                                                        selectedIcon ===
                                                                        icon.name
                                                                            ? 'default'
                                                                            : 'outline'
                                                                    }
                                                                    className={`items-center justify-center gap-2 hover:bg-accent ${
                                                                        selectedIcon ===
                                                                        icon.name
                                                                            ? 'ring-2 ring-primary'
                                                                            : ''
                                                                    }`}
                                                                    onClick={(
                                                                        e
                                                                    ) =>
                                                                        handleIconSelect(
                                                                            e,
                                                                            icon.name
                                                                        )
                                                                    }
                                                                >
                                                                    {renderIcon(
                                                                        icon.name
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {icon.name}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )
                                                )}
                                            </div>
                                        </TabsContent>
                                    )
                                )}
                            </div>
                        </Tabs>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </TooltipProvider>
    );
}
