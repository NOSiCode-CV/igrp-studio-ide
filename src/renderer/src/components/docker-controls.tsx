import React, { useState } from 'react'
import { Play, Square, Loader2, ChevronDown, Trash2 } from 'lucide-react'
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
import {
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { IGRPSeparatorPrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPCheckboxPrimitive } from '@igrp/igrp-framework-react-design-system'
import {
  IGRPTooltipPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPTooltipTriggerPrimitive,
  IGRPTooltipProviderPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { useTranslation } from 'react-i18next'

interface DockerControlsProps {
  loading: boolean
  onRun: () => Promise<void>
  onStopAll: () => Promise<void>
  onDropAll: (dropVolume: boolean) => Promise<void>
}

const DockerControls: React.FC<DockerControlsProps> = ({
  loading,
  onRun,
  onStopAll,
  onDropAll
}) => {
  const { t } = useTranslation()
  const [dropVolume, setDropVolume] = useState<boolean>(false)
  const [isRunning, setIsRunning] = useState<boolean>(false)

  const handleRun = async () => {
    if (isRunning || loading) return

    setIsRunning(true)
    try {
      await onRun()
    } catch (error) {
      console.error('Error running containers:', error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <IGRPTooltipProviderPrimitive>
      <div className="flex items-center border rounded-md space-x-1">
        <IGRPButtonPrimitive
          variant="ghost"
          size="sm"
          className={`
              relative h-6 text-xs overflow-hidden group
              ${loading || isRunning ? 'animate-pulse' : ''}
            `}
          disabled={loading || isRunning}
          onClick={handleRun}
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 
                          group-hover:translate-x-full -translate-x-full transition-transform duration-700"
          />
          <div className="flex items-center gap-1.5">
            {loading || isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-igrp" />
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-igrp" />
                <span className="font-medium ">{t('run')}</span>
              </>
            )}
          </div>
        </IGRPButtonPrimitive>
        <IGRPSeparatorPrimitive
          orientation="vertical"
          className="data-[orientation=vertical]:h-4"
        />
        <IGRPDropdownMenuPrimitive>
          <IGRPDropdownMenuTriggerPrimitive asChild>
            <IGRPButtonPrimitive variant="ghost" size="sm" className="h-6 text-xs">
              <ChevronDown className="h-3.5 w-3.5 text-igrp" />
            </IGRPButtonPrimitive>
          </IGRPDropdownMenuTriggerPrimitive>
          <IGRPDropdownMenuContentPrimitive align="end" className="w-48">
            <IGRPDropdownMenuItemPrimitive onClick={() => onStopAll()} className="group">
              <Square className="h-3.5 w-3.5" />
              <span className="font-medium">{t('stop')}</span>
            </IGRPDropdownMenuItemPrimitive>
            <IGRPDropdownMenuSeparatorPrimitive />

            <IGRPDropdownMenuItemPrimitive
              onClick={(e) => {
                // Only handle the action if the click wasn't on the checkbox
                if (!(e.target as HTMLElement).closest('.checkbox-container')) {
                  onDropAll(dropVolume)
                  setDropVolume(false)
                }
              }}
              className="group"
              asChild
            >
              <div className="flex flex-1 items-center justify-between">
                <div className="flex flex-1 items-center">
                  <Trash2 className="h-3.5 w-3.5 mr-2 text-destructive group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-medium">{t('delete')}</span>
                </div>
                <div className="checkbox-container" onClick={(e) => e.stopPropagation()}>
                  <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive asChild>
                      <IGRPCheckboxPrimitive
                        name="drop-volume"
                        checked={dropVolume}
                        onCheckedChange={(checked: boolean) => setDropVolume(checked)}
                      />
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive>
                      <p>{t('deleteContainersVolumes')}</p>
                    </IGRPTooltipContentPrimitive>
                  </IGRPTooltipPrimitive>
                </div>
              </div>
            </IGRPDropdownMenuItemPrimitive>
          </IGRPDropdownMenuContentPrimitive>
        </IGRPDropdownMenuPrimitive>
      </div>
    </IGRPTooltipProviderPrimitive>
  )
}

export default DockerControls
