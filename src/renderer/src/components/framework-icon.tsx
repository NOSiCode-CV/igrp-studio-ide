import { cn } from '@renderer/lib/utils'
import type React from 'react'

// Icon mapping using reliable CDN sources
const ICONS = {
    nextjs: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
    springboot: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg',
    dotnet: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dotnetcore/dotnetcore-original.svg',
    vuejs: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
    angular: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg',
    django: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg',
    go: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
    specification:
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z'/><path d='M20 3v4'/><path d='M22 5h-4'/><path d='M4 17v2'/><path d='M5 18H3'/></svg>"
} as const

export type FrameworkType = keyof typeof ICONS

interface FrameworkIconProps {
    framework: FrameworkType
    size?: number
    className?: string
    alt?: string
}

export const FrameworkIcon: React.FC<FrameworkIconProps> = ({
    framework,
    size = 40,
    className,
    alt
}) => {
    const iconSrc = ICONS[framework]

    if (!iconSrc) {
        console.warn(`No icon found for framework: ${framework}`)
        return null
    }

    return (
        <img
            src={iconSrc}
            alt={alt || `${framework} framework icon`}
            width={size}
            height={size}
            className={cn('rounded-lg object-contain', className)}
        />
    )
}

// Convenience component for project icons
interface ProjectIconProps {
    framework: FrameworkType
    size?: number
    className?: string
}

export const ProjectIcon: React.FC<ProjectIconProps> = ({ framework, size = 40, className }) => {
    return (
        <FrameworkIcon
            framework={framework}
            size={size}
            className={cn('bg-muted p-1', className)}
        />
    )
}

// Export the icon mapping for backward compatibility
export const projectIcons = ICONS
