import { ProjectData } from 'src/main/types';
import { projectIcons } from '@renderer/constants/appConstants';
import { LucideIcon, Search } from 'lucide-react';
import { Input } from './ui/input';

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
function ProjectIcon({ project }: { project: ProjectData }) {
    return project.icon ? (
        <img
            src={project.icon}
            alt="Project icon"
            width={20}
            height={20}
            className="rounded-full"
        />
    ) : projectIcons[project.framework] ? (
        <img
            src={projectIcons[project.framework]}
            alt={`${project.framework} logo`}
            width={20}
            height={20}
        />
    ) : null;
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
export { ProjectIcon, Headline, SearchInput, SubHeadline };
