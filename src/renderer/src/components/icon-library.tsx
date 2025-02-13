import React, { useState } from 'react';
import { icons } from 'lucide-react'; // Import icons properly
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from './ui/tooltip';

const IconLibrary: React.FC = () => {
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const iconNames = Object.keys(icons) as Array<keyof typeof icons>;

    const handleIconClick = (iconName: keyof typeof icons) => {
        setSelectedIcon(iconName);
    };

    // Filter icons based on search query
    const filteredIcons = iconNames.filter((icon) =>
        icon.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <TooltipProvider>
            <div className="mt-4 space-y-3">
                <p className="font-semibold">Icons</p>
                {/* Search Input */}
                <Input
                    type="text"
                    placeholder="Search icons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <ScrollArea className="h-48">
                    <div className="flex flex-wrap gap-4">
                        {filteredIcons.length > 0 ? (
                            filteredIcons.map((icon) => {
                                const IconComponent = icons[icon];
                                return (
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Button
                                                key={icon}
                                                variant={'ghost'}
                                                onClick={() =>
                                                    handleIconClick(icon)
                                                }
                                                size={'sm'}
                                            >
                                                <IconComponent
                                                    name={icon}
                                                    className="h-6 w-6"
                                                />
                                                <span className="sr-only text-xs">
                                                    {icon}
                                                </span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{icon}</TooltipContent>
                                    </Tooltip>
                                );
                            })
                        ) : (
                            <p>No icons found.</p>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </TooltipProvider>
    );
};

export default IconLibrary;
