import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { useTheme } from '@renderer/components/theme-provider';
import {
    IGRPTooltipPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';

export function ModeToggle() {
    const { t } = useTranslation();
    const { setTheme } = useTheme();

    return (
        <IGRPDropdownMenuPrimitive>
            <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive asChild>
                    <IGRPDropdownMenuTriggerPrimitive asChild>
                        <IGRPButtonPrimitive variant="ghost" size="icon">
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </IGRPButtonPrimitive>
                    </IGRPDropdownMenuTriggerPrimitive>
                </IGRPTooltipTriggerPrimitive>
                <IGRPTooltipContentPrimitive>
                    <p>{t('toggleTheme')}</p>
                </IGRPTooltipContentPrimitive>
            </IGRPTooltipPrimitive>
            <IGRPDropdownMenuContentPrimitive align="end">
                <IGRPDropdownMenuItemPrimitive
                    onClick={() => setTheme('light')}
                >
                    {t('light')}
                </IGRPDropdownMenuItemPrimitive>
                <IGRPDropdownMenuItemPrimitive onClick={() => setTheme('dark')}>
                    {t('dark')}
                </IGRPDropdownMenuItemPrimitive>
                <IGRPDropdownMenuItemPrimitive
                    onClick={() => setTheme('system')}
                >
                    {t('system')}
                </IGRPDropdownMenuItemPrimitive>
            </IGRPDropdownMenuContentPrimitive>
        </IGRPDropdownMenuPrimitive>
    );
}
