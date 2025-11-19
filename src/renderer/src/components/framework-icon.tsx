import React from 'react'
import { cn } from '@renderer/lib/utils'

// Icon mapping using reliable CDN sources
const ICONS = {
  nextjs: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
  springboot: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg',
  dotnet: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dotnetcore/dotnetcore-original.svg',
  vuejs: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
  angular: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg',
  django: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg',
  go: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg'
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
    <FrameworkIcon framework={framework} size={size} className={cn('bg-muted p-1', className)} />
  )
}

// Export the icon mapping for backward compatibility
export const projectIcons = ICONS
