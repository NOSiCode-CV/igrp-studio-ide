'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import {
    IGRPInputPrimitive,
    IGRPSwitchPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { useTranslation } from 'react-i18next';
import { SHORTCUTS } from '@renderer/constants/shortcut';

interface Shortcut {
    name: string;
    shortcut: string | string[];
    description?: string;
}

interface ShortcutGroup {
    title: string;
    shortcuts: Shortcut[];
}

export default function KeyboardShortcuts() {
    const { t } = useTranslation();
    const [search, setSearch] = React.useState('');
    const [enabled, setEnabled] = React.useState(true);

    const shortcutData: ShortcutGroup[] = React.useMemo(
        () => [
            {
                title: t('endpoints'),
                shortcuts: [
                    {
                        name: t('newEndpoint'),
                        shortcut: SHORTCUTS.NEW_CONTROLLER,
                    },
                    { name: t('newSchema'), shortcut: SHORTCUTS.NEW_MODEL },
                    { name: t('newDto'), shortcut: SHORTCUTS.NEW_DTO },
                    { name: t('newProject'), shortcut: SHORTCUTS.NEW_PROJECT },
                    { name: t('save'), shortcut: SHORTCUTS.SAVE },
                    { name: t('delete'), shortcut: SHORTCUTS.DELETE },
                ],
            },
            {
                title: t('tabs'),
                shortcuts: [
                    { name: t('closeTab'), shortcut: SHORTCUTS.CLOSE_TAB },
                    {
                        name: t('forceQuitTab'),
                        shortcut: SHORTCUTS.FORCE_QUIT_TAB,
                    },
                    {
                        name: t('switchToNextTab'),
                        shortcut: SHORTCUTS.SWITCH_TO_NEXT_TAB,
                    },
                    {
                        name: t('switchToPreviousTab'),
                        shortcut: SHORTCUTS.SWITCH_TO_PREVIOUS_TAB,
                    },
                    {
                        name: t('jumpToSpecificTab'),
                        shortcut: SHORTCUTS.JUMP_TO_SPECIFIC_TAB,
                    },
                    {
                        name: t('jumpToLastTab'),
                        shortcut: SHORTCUTS.JUMP_TO_LAST_TAB,
                    },
                ],
            },
            {
                title: t('codeEditor'),
                shortcuts: [
                    { name: t('find'), shortcut: SHORTCUTS.FIND },
                    { name: t('replace'), shortcut: SHORTCUTS.REPLACE },
                ],
            },
            {
                title: t('general'),
                shortcuts: [
                    {
                        name: t('toggleSidebar'),
                        shortcut: SHORTCUTS.CLOSE_SIDEBAR,
                    },
                    { name: t('settings'), shortcut: SHORTCUTS.SETTINGS },
                    { name: t('wrap'), shortcut: ['↵', '⇧ ↵'] },
                    { name: t('hideWindow'), shortcut: t('clickToEdit') },
                    { name: t('zoomIn'), shortcut: SHORTCUTS.ZOOM_IN },
                    { name: t('zoomOut'), shortcut: SHORTCUTS.ZOOM_OUT },
                    {
                        name: t('openShortcutHelp'),
                        shortcut: SHORTCUTS.OPEN_SHORTCUT_HELP,
                    },
                ],
            },
        ],
        [t]
    );

    const filteredGroups = React.useMemo(
        () =>
            shortcutData
                .map((group) => ({
                    ...group,
                    shortcuts: group.shortcuts.filter((shortcut) =>
                        shortcut.name
                            .toLowerCase()
                            .includes(search.toLowerCase())
                    ),
                }))
                .filter((group) => group.shortcuts.length > 0),
        [shortcutData, search]
    );

    const renderShortcut = (shortcut: string | string[]) => {
        if (Array.isArray(shortcut)) {
            return (
                <>
                    <kbd className="rounded bg-muted px-2 py-1 text-xs">
                        {shortcut[0]}
                    </kbd>
                    <span className="text-xs text-muted-foreground">
                        {t('or')}
                    </span>
                    <kbd className="rounded bg-muted px-2 py-1 text-xs">
                        {shortcut[1]}
                    </kbd>
                </>
            );
        }
        return (
            <kbd className="rounded bg-muted px-2 py-1 text-xs">{shortcut}</kbd>
        );
    };

    return (
        <div className="space-y-6">
            <div className="pb-4 space-y-4">
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                            {t('keyboardShortcuts')}
                        </span>
                        <IGRPSwitchPrimitive
                            checked={enabled}
                            onCheckedChange={setEnabled}
                        />
                    </div>
                    <IGRPButtonPrimitive
                        variant="outline"
                        size="sm"
                        onClick={() => setEnabled(true)}
                    >
                        {t('resetToDefault')}
                    </IGRPButtonPrimitive>
                </div>

                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <IGRPInputPrimitive
                        placeholder={t('searchShortcuts')}
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-6">
                {filteredGroups.map((group) => (
                    <div key={group.title}>
                        <h3 className="text-sm font-semibold text-foreground">
                            {group.title}
                        </h3>
                        <div className="mt-2 space-y-2">
                            {group.shortcuts.map((shortcut) => (
                                <div
                                    key={shortcut.name}
                                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted"
                                >
                                    <span className="text-sm">
                                        {shortcut.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {renderShortcut(shortcut.shortcut)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
