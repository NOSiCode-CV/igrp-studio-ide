import React, { useState } from 'react';
import { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Database,
    Globe,
    Server,
    HardDrive,
    Shield,
    Compass
} from 'lucide-react';
import {
    IGRPBadgePrimitive,
    IGRPButtonPrimitive,
} from '@igrp/igrp-framework-react-design-system';

export interface ServiceCategory {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    types: string[];
}

export interface ServiceFilterProps {
    onFilterChange: (category: string, searchQuery: string) => void;
    totalServices: number;
}

const serviceCategories: ServiceCategory[] = [
    {
        id: 'all',
        name: 'All Services',
        icon: <Server className="h-4 w-4" />,
        color: 'bg-gray-500',
        types: [],
    },
    {
        id: 'infrastructure',
        name: 'Infrastructure',
        icon: <Server className="h-4 w-4" />,
        color: 'bg-blue-500',
        types: ['proxy', 'service-discovery', 'cache'],
    },
    {
        id: 'database',
        name: 'Database',
        icon: <Database className="h-4 w-4" />,
        color: 'bg-amber-500',
        types: ['database'],
    },
    {
        id: 'web',
        name: 'Web Services',
        icon: <Globe className="h-4 w-4" />,
        color: 'bg-blue-500',
        types: ['web', 'api'],
    },
    {
        id: 'storage',
        name: 'Storage',
        icon: <HardDrive className="h-4 w-4" />,
        color: 'bg-orange-500',
        types: ['storage', 'file'],
    },
    {
        id: 'security',
        name: 'Security',
        icon: <Shield className="h-4 w-4" />,
        color: 'bg-red-500',
        types: ['auth'],
    },
    {
        id: 'monitoring',
        name: 'Monitoring',
        icon: <Compass className="h-4 w-4" />,
        color: 'bg-purple-500',
        types: ['observability', 'messaging'],
    },
];

export function ServiceFilter({
    onFilterChange,
    totalServices,
}: ServiceFilterProps): JSX.Element {
    const { t } = useTranslation();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const handleCategoryClick = (categoryId: string): void => {
        setActiveCategory(categoryId);
        onFilterChange(categoryId, searchQuery);
    };

    const clearFilters = (): void => {
        setActiveCategory('all');
        setSearchQuery('');
        onFilterChange('all', '');
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
           {/*  <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder={t('searchServices')}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {searchQuery && (
                    <button
                        onClick={() => handleSearchChange('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div> */}

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
                {serviceCategories.map((category) => (
                    <IGRPBadgePrimitive
                        key={category.id}
                        variant={
                            activeCategory === category.id
                                ? 'default'
                                : 'outline'
                        }
                        size="sm"
                        onClick={() => handleCategoryClick(category.id)}
                        className={`flex items-center gap-2 ${
                            activeCategory === category.id
                                ? `${category.color} text-white hover:opacity-90`
                                : 'hover:bg-muted'
                        }`}
                    >
                        {category.icon}
                        <span>{category.name}</span>
                        {category.id !== 'all' && (
                            <span className="text-xs opacity-75">
                                ({category.types.length})
                            </span>
                        )}
                    </IGRPBadgePrimitive>
                ))}
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    {totalServices}{' '}
                    {totalServices === 1 ? t('service') : t('services')}
                    {activeCategory !== 'all' && (
                        <span className="ml-1">
                            in{' '}
                            {
                                serviceCategories.find(
                                    (c) => c.id === activeCategory
                                )?.name
                            }
                        </span>
                    )}
                </span>
                {(activeCategory !== 'all' || searchQuery) && (
                    <IGRPButtonPrimitive
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs"
                    >
                        Clear filters
                    </IGRPButtonPrimitive>
                )}
            </div>
        </div>
    );
}
