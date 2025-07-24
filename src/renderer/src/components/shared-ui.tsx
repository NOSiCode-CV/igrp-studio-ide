import * as React from 'react';
import { ProjectData } from 'src/main/types';
import { LucideIcon, Search } from 'lucide-react';
import { Input } from './ui/input';
import * as LucideIcons from 'lucide-react';
import { FrameworkIcon } from './framework-icon';

interface HeadlineProps {
    icon?: LucideIcon; // Optional icon
    title: string;
    description?: React.ReactNode;
    className?: string;
}

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    iconClassName?: string;
    width?: string | number;
}

// Get project type icon
function ProjectIcon({ project, workspacePath }: { project: ProjectData; workspacePath?: string }) {
    const [iconUrl, setIconUrl] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        const loadIcon = async () => {
            if (!project.icon) {
                setIconUrl(null);
                return;
            }

            // If it's already a data URL (base64), use it directly
            if (project.icon.startsWith('data:')) {
                setIconUrl(project.icon);
                return;
            }

            // If it's a relative path, load it securely
            if (project.icon.startsWith('icons/') || project.icon.startsWith('assets/')) {
                if (!workspacePath) {
                    console.warn('Workspace path not provided for project icon loading');
                    setIconUrl(null);
                    return;
                }
                
                setIsLoading(true);
                try {
                    const result = await window.api.getIconFile(project.icon, workspacePath);
                    if (result.success) {
                        setIconUrl(result.data);
                    } else {
                        console.warn('Failed to load project icon:', result.error);
                        setIconUrl(null);
                    }
                } catch (error) {
                    console.error('Error loading project icon:', error);
                    setIconUrl(null);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIconUrl(null);
            }
        };

        loadIcon();
    }, [project.icon, workspacePath]);

    if (isLoading) {
        return (
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (iconUrl) {
        return (
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <img
                    src={iconUrl}
                    alt="Project icon"
                    width={20}
                    height={20}
                    className="rounded-full object-cover"
                />
            </div>
        );
    }

    return (
        <FrameworkIcon
            framework={project.framework as any}
            size={20}
            className="h-8 w-8 rounded-lg bg-muted p-1"
            alt={`${project.framework} logo`}
        />
    );
}

function SearchInput({
    value,
    onChange,
    placeholder = 'Search...',
    className = '',
    inputClassName = '',
    iconClassName = '',
}: SearchInputProps) {
    return (
        <div className={`relative ${className} `}>
            <Search
                className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground ${iconClassName}`}
            />
            <Input
                type="text"
                placeholder={placeholder}
                className={`pl-8 h-8 text-xs ${inputClassName}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function Headline({
    icon: Icon,
    title,
    description,
    className = '',
}: HeadlineProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {Icon && <Icon className="h-5 w-5 text-primary" />}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}

function SubHeadline({
    icon: Icon,
    title,
    description,
    className = '',
}: HeadlineProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {Icon && <Icon className="h-5 w-5 text-primary" />}
            <div>
                <h1 className="text-base font-medium leading-tight">{title}</h1>
                {description && (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}

function getIcon(iconName: string) {
    console.log(iconName);
    return LucideIcons[iconName as keyof typeof LucideIcons] || undefined;
}

export { ProjectIcon, Headline, SearchInput, SubHeadline, getIcon };
