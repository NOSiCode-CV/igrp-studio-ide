import { projectIcons } from '@renderer/constants/appConstants'
import { FileText, Home, LucideIcon, Settings } from 'lucide-react'
import { ProjectData } from 'src/main/types'

interface MenuItem {
  href: string
  label: string
  icon: LucideIcon // For non-project icons
}

const defaultIcon = '/path/to/default-icon.png'

export default function VerticalMenu({ config }: { config: ProjectData }) {
  const menuItems: MenuItem[] = [
    { icon: Home, href: '/', label: 'Home' },
    { icon: FileText, href: '/app', label: 'APP' },
    { icon: FileText, href: '/documents', label: 'Documents' },
    { icon: Settings, href: '/settings', label: 'Settings' }
  ]

  return (
    <nav className="bg-muted/75 w-20 flex flex-col items-center py-4">
      {menuItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className="p-3 rounded-lg mb-4 flex flex-col items-center"
        >
          {item.href === '/app' ? ( // Check if the href is for a project
            <>
              {' '}
              <img
                src={projectIcons[config.framework] || defaultIcon}
                alt={`${config.type} logo`}
                width={24}
                height={24}
                className="mb-1"
              />
              {config.name && <span className="text-xs text-center">APIs</span>}
            </>
          ) : (
            <>
              {' '}
              <div className="w-8 h-8 flex items-center justify-center mb-1">
                {item.icon && <item.icon size={24} className="mb-1" />}
              </div>
              <span className="text-xs text-center">{item.label}</span>
            </>
          )}
        </a>
      ))}
    </nav>
  )
}
