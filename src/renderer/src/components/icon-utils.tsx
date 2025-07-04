import React from 'react';
import { cn } from '@renderer/lib/utils';
import { LucideIcon, icons } from 'lucide-react';
import { FrameworkIcon, FrameworkType } from './framework-icon';

// Icon size presets
export const ICON_SIZES = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
} as const;

export type IconSize = keyof typeof ICON_SIZES;

// Icon types
export type IconType = 'framework' | 'lucide' | 'custom';

// Base icon props
interface BaseIconProps {
    size?: IconSize | number;
    className?: string;
    alt?: string;
}

// Framework icon props
interface FrameworkIconProps extends BaseIconProps {
    type: 'framework';
    name: FrameworkType;
}

// Lucide icon props
interface LucideIconProps extends BaseIconProps {
    type: 'lucide';
    name: keyof typeof icons;
}

// Custom icon props
interface CustomIconProps extends BaseIconProps {
    type: 'custom';
    src: string;
}

// Union type for all icon props
type IconProps = FrameworkIconProps | LucideIconProps | CustomIconProps;

/**
 * Universal Icon component that handles different icon types
 */
export const Icon: React.FC<IconProps> = (props) => {
    const { size = 'md', className, alt } = props;
    
    // Convert size to number
    const sizeValue = typeof size === 'string' ? ICON_SIZES[size] : size;

    switch (props.type) {
        case 'framework':
            return (
                <FrameworkIcon
                    framework={props.name}
                    size={sizeValue}
                    className={className}
                    alt={alt}
                />
            );
            
        case 'lucide':
            const LucideIconComponent = icons[props.name];
            if (!LucideIconComponent) {
                console.warn(`Lucide icon "${props.name}" not found`);
                return null;
            }
            return (
                <LucideIconComponent
                    size={sizeValue}
                    className={cn('inline-block', className)}
                    aria-label={alt}
                />
            );
            
        case 'custom':
            return (
                <img
                    src={props.src}
                    alt={alt || 'Custom icon'}
                    width={sizeValue}
                    height={sizeValue}
                    className={cn('inline-block object-contain', className)}
                    loading="lazy"
                />
            );
            
        default:
            return null;
    }
};

/**
 * Convenience component for framework icons
 */
export const FrameworkIconWrapper: React.FC<{
    framework: FrameworkType;
    size?: IconSize | number;
    className?: string;
    alt?: string;
}> = ({ framework, size, className, alt }) => (
    <Icon
        type="framework"
        name={framework}
        size={size}
        className={className}
        alt={alt}
    />
);

/**
 * Convenience component for Lucide icons
 */
export const LucideIconWrapper: React.FC<{
    name: keyof typeof icons;
    size?: IconSize | number;
    className?: string;
    alt?: string;
}> = ({ name, size, className, alt }) => (
    <Icon
        type="lucide"
        name={name}
        size={size}
        className={className}
        alt={alt}
    />
);

/**
 * Get icon size in pixels
 */
export const getIconSize = (size: IconSize | number): number => {
    return typeof size === 'string' ? ICON_SIZES[size] : size;
};

/**
 * Validate if a string is a valid Lucide icon name
 */
export const isValidLucideIcon = (name: string): name is keyof typeof icons => {
    return name in icons;
};

/**
 * Get all available Lucide icon names
 */
export const getAvailableLucideIcons = (): string[] => {
    return Object.keys(icons);
}; 