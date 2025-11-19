import React from 'react'
import {
  IGRPCard,
  IGRPCardContent,
  IGRPCardDescription,
  IGRPCardFooter,
  IGRPCardHeader,
  IGRPCardTitle,
  IGRPSwitchPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
import {
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system'
import {
  Settings,
  TestTube,
  Trash2,
  Edit,
  ExternalLink,
  Clock,
  Calendar,
  MoreHorizontal
} from 'lucide-react'
import { BPMNConfig } from 'src/main/types'

interface BPMNConfigCardProps {
  config: BPMNConfig
  isActive: boolean
  onEdit: (config: BPMNConfig) => void
  onDelete: (configId: string) => void
  onToggleActive: (configId: string, isActive: boolean) => void
  onTestConnection: (config: BPMNConfig) => void
}

export const BPMNConfigCard: React.FC<BPMNConfigCardProps> = ({
  config,
  isActive,
  onEdit,
  onDelete,
  onToggleActive,
  onTestConnection
}) => {
  const [isTesting, setIsTesting] = React.useState(false)
  const [isToggling, setIsToggling] = React.useState(false)

  const handleTestConnection = async (): Promise<void> => {
    setIsTesting(true)
    try {
      await onTestConnection(config)
    } finally {
      setIsTesting(false)
    }
  }

  const handleToggleActive = async (): Promise<void> => {
    setIsToggling(true)
    try {
      await onToggleActive(config.id, !isActive)
    } finally {
      setIsToggling(false)
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <IGRPCard
      className={`transition-all duration-200 hover:shadow-md ${!isActive ? 'opacity-60' : ''}`}
    >
      <IGRPCardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <IGRPCardTitle className="text-lg">{config.name}</IGRPCardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <IGRPSwitchPrimitive
                id={`active-${config.id}`}
                checked={isActive}
                onCheckedChange={handleToggleActive}
                disabled={isToggling}
              />
              <IGRPLabelPrimitive htmlFor={`active-${config.id}`} className="text-xs">
                Active
              </IGRPLabelPrimitive>
            </div>
            <IGRPDropdownMenuPrimitive>
              <IGRPDropdownMenuTriggerPrimitive asChild>
                <IGRPButtonPrimitive variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </IGRPButtonPrimitive>
              </IGRPDropdownMenuTriggerPrimitive>
              <IGRPDropdownMenuContentPrimitive align="end" className="min-w-40">
                <IGRPDropdownMenuItemPrimitive onClick={() => onEdit(config)}>
                  <Edit className="h-3 w-3 mr-2" /> Edit
                </IGRPDropdownMenuItemPrimitive>
                <IGRPDropdownMenuItemPrimitive onClick={handleTestConnection} disabled={isTesting}>
                  <TestTube className="h-3 w-3 mr-2" /> {isTesting ? 'Testing...' : 'Test'}
                </IGRPDropdownMenuItemPrimitive>
                <IGRPDropdownMenuSeparatorPrimitive />
                <IGRPDropdownMenuItemPrimitive onClick={() => window.open(config.apiUrl, '_blank')}>
                  <ExternalLink className="h-3 w-3 mr-2" /> Open
                </IGRPDropdownMenuItemPrimitive>
                <IGRPDropdownMenuItemPrimitive
                  onClick={() => onDelete(config.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-2" /> Delete
                </IGRPDropdownMenuItemPrimitive>
              </IGRPDropdownMenuContentPrimitive>
            </IGRPDropdownMenuPrimitive>
          </div>
        </div>
        {config.description && (
          <IGRPCardDescription className="mt-2">{config.description}</IGRPCardDescription>
        )}
      </IGRPCardHeader>

      <IGRPCardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground">API URL:</span>
            <span
              className="text-right font-mono text-xs truncate max-w-[200px]"
              title={config.apiUrl}
            >
              {config.apiUrl}
            </span>
          </div>
          {config.basePath && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground">Base Path:</span>
              <span className="text-right font-mono text-xs">{config.basePath}</span>
            </div>
          )}
          {config.token && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground">Token:</span>
              <span className="text-right font-mono text-xs">
                {config.token.substring(0, 8)}...
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Created: {formatDate(config.createdAt)}</span>
          </div>
          {config.lastConnected && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Last: {formatDate(config.lastConnected)}</span>
            </div>
          )}
        </div>
      </IGRPCardContent>

      <IGRPCardFooter className="pt-0" />
    </IGRPCard>
  )
}
