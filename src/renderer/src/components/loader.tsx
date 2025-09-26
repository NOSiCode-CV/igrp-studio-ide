import React from 'react';
import { cn } from '@renderer/lib/utils';

interface LoaderProps {
    /**
     * Error message to display instead of the spinner
     */
    error?: string;
    /**
     * Size variant of the loader
     */
    size?: 'sm' | 'md' | 'lg';
    /**
     * Container height variant
     */
    variant?: 'fullscreen' | 'container' | 'inline';
    /**
     * Custom className for the container
     */
    className?: string;
    /**
     * Custom message to display with the loader
     */
    message?: string;
}

const Loader: React.FC<LoaderProps> = ({
    error,
    size = 'md',
    variant = 'container',
    className,
    message,
}) => {
    // Size configurations
    const sizeConfig = {
        sm: 'h-6 w-6 border-2',
        md: 'h-12 w-12 border-t-4',
        lg: 'h-16 w-16 border-t-4',
    };

    // Variant configurations
    const variantConfig = {
        fullscreen: 'h-screen',
        container: 'h-64',
        inline: 'h-auto',
    };

    // If there's an error, show error message
    if (error) {
        return (
            <div
                className={cn(
                    'flex flex-col justify-center items-center gap-4',
                    variantConfig[variant],
                    className
                )}
            >
                <div className="text-red-500 text-center">
                    <p className="text-sm font-medium">Error</p>
                    <p className="text-xs text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex flex-col justify-center items-center gap-4',
                variantConfig[variant],
                className
            )}
        >
            <div
                className={cn(
                    'animate-spin rounded-full border-solid',
                    sizeConfig[size],
                    // Use design system colors for better theming
                    'border-primary/20 border-t-primary'
                )}
            ></div>
            {message && (
                <p className="text-sm text-muted-foreground text-center">
                    {message}
                </p>
            )}
        </div>
    );
};

// Export both as default and named export for backward compatibility
export default Loader;
export { Loader };

// Legacy export for backward compatibility
export const LoadingSpinner: React.FC<Omit<LoaderProps, 'variant'>> = (
    props
) => <Loader {...props} variant="container" />