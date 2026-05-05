'use client'

import {
    IGRPButtonPrimitive,
    IGRPLabelPrimitive,
    IGRPSkeletonPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { useThemeConfig } from '@renderer/components/active-theme-provider'
import { cn } from '@renderer/lib/utils'
import { ThemeService } from '@renderer/services/ThemeService'
import { Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { baseColors } from '../base-color'

export function AppearanceSettings() {
    const { t } = useTranslation()

    const { activeTheme, setActiveTheme } = useThemeConfig()

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const { resolvedTheme: mode } = useTheme()

    async function saveTheme(newTheme: string): Promise<void> {
        await ThemeService.setActiveTheme(newTheme)
    }

    return (
        <div>
            <div className="pb-4">
                <h2 className="text-lg font-semibold">{t('appearance')}</h2>
            </div>
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <IGRPLabelPrimitive className="text-xs">{t('accentColor')}</IGRPLabelPrimitive>
                    <div className="grid w-full md:grid-cols-4 grid-cols-6 gap-3">
                        {baseColors.map((theme) => {
                            const isActive = activeTheme === theme.name

                            return mounted ? (
                                <IGRPButtonPrimitive
                                    variant="outline"
                                    size="sm"
                                    key={theme.name}
                                    onClick={() => {
                                        saveTheme(theme.name)
                                        setActiveTheme(theme.name)
                                    }}
                                    className={cn(
                                        'rounded-lg lg:px-2.5 xl:w-[86px]',
                                        isActive && 'border-primary/50 ring-[2px] ring-primary/30'
                                    )}
                                    style={
                                        {
                                            '--theme-primary': `hsl(${
                                                theme?.activeColor[
                                                    mode === 'dark' ? 'dark' : 'light'
                                                ]
                                            })`
                                        } as React.CSSProperties
                                    }
                                >
                                    <span
                                        className={cn(
                                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[--theme-primary]'
                                        )}
                                        style={
                                            {
                                                background: `hsl(${theme?.activeColor[mode === 'dark' ? 'dark' : 'light']})`
                                            } as React.CSSProperties
                                        }
                                    >
                                        {isActive && <Check className="!size-2.5 text-white" />}
                                    </span>
                                    <span className="hidden md:block">
                                        {theme.label === 'Zinc' ? 'default' : theme.label}
                                    </span>
                                </IGRPButtonPrimitive>
                            ) : (
                                <IGRPSkeletonPrimitive
                                    className="h-8 w-[32px] xl:w-[86px]"
                                    key={theme.name}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
