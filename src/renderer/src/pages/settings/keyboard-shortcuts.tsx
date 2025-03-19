'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@renderer/components/ui/input';
import { Button } from '@renderer/components/ui/button';
import { useTranslation } from 'react-i18next';
import { SHORTCUTS } from '@renderer/constants/shortcutConstants';
import { Switch } from '@renderer/components/ui/switch';

interface Shortcut {
    name: string;
    shortcut: string | string[];
    description?: string;
}

interface ShortcutGroup {
    title: string;
    shortcuts: Shortcut[];
}

const shortcutData: ShortcutGroup[] = [
    {
        title: 'Endpoints',
        shortcuts: [
            { name: 'New Endpoint', shortcut: SHORTCUTS.NEW_CONTROLLER },
            { name: 'New Schema', shortcut: SHORTCUTS.NEW_MODEL },
            { name: 'New Dto', shortcut: SHORTCUTS.NEW_DTO },
            { name: 'New Project', shortcut: SHORTCUTS.NEW_PROJECT },
            { name: 'Save', shortcut: SHORTCUTS.SAVE },
            { name: 'Delete', shortcut: SHORTCUTS.DELETE },
        ],
    },
    {
        title: 'Tabs',
        shortcuts: [
            { name: 'Close Tab', shortcut: SHORTCUTS.CLOSE_TAB },
            { name: 'Force Quit Tab', shortcut: SHORTCUTS.FORCE_QUIT_TAB },
            {
                name: 'Switch to Next tab',
                shortcut: SHORTCUTS.SWITCH_TO_NEXT_TAB,
            },
            {
                name: 'Switch to Previous tab',
                shortcut: SHORTCUTS.SWITCH_TO_PREVIOUS_TAB,
            },
            {
                name: 'Jump to Specific Tab',
                shortcut: SHORTCUTS.JUMP_TO_SPECIFIC_TAB,
            },
            { name: 'Jump to Last Tab', shortcut: SHORTCUTS.JUMP_TO_LAST_TAB },
        ],
    },
    {
        title: 'Code Editor',
        shortcuts: [
            { name: 'Find', shortcut: SHORTCUTS.FIND },
            { name: 'Replace', shortcut: SHORTCUTS.REPLACE },
        ],
    },
    {
        title: 'General',
        shortcuts: [
            { name: 'Open/Close Sidebar', shortcut: SHORTCUTS.CLOSE_SIDEBAR },
            { name: 'Settings', shortcut: SHORTCUTS.SETTINGS },
            { name: 'Wrap', shortcut: ['↵', '⇧ ↵'] }, // Não precisa de adaptação, pois é específico do editor
            { name: 'Hide Window', shortcut: 'Click to edit' }, // Ação não relacionada a atalhos de teclado
            { name: 'Zoom in', shortcut: SHORTCUTS.ZOOM_IN },
            { name: 'Zoom out', shortcut: SHORTCUTS.ZOOM_OUT },
            {
                name: 'Open Shortcut Help',
                shortcut: SHORTCUTS.OPEN_SHORTCUT_HELP,
            },
        ],
    },
];

export default function KeyboardShortcuts() {
    const [search, setSearch] = React.useState('');
    const [enabled, setEnabled] = React.useState(true);

    const { t } = useTranslation();

    const filteredGroups = shortcutData
        .map((group) => ({
            ...group,
            shortcuts: group.shortcuts.filter((shortcut) =>
                shortcut.name.toLowerCase().includes(search.toLowerCase())
            ),
        }))
        .filter((group) => group.shortcuts.length > 0);

    return (
        <div>
            <div className="pb-4">
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                            {t('keyboardShortcuts')}
                        </span>
                        <Switch
                            checked={enabled}
                            onCheckedChange={setEnabled}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEnabled(true)}
                    >
                        Reset to default
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search shortcuts"
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className="mt-6 space-y-6">
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
                                        {Array.isArray(shortcut.shortcut) ? (
                                            <>
                                                <kbd className="rounded bg-muted px-2 py-1 text-xs">
                                                    {shortcut.shortcut[0]}
                                                </kbd>
                                                <span className="text-xs text-muted-foreground">
                                                    or
                                                </span>
                                                <kbd className="rounded bg-muted px-2 py-1 text-xs">
                                                    {shortcut.shortcut[1]}
                                                </kbd>
                                            </>
                                        ) : (
                                            <kbd className="rounded bg-muted px-2 py-1 text-xs">
                                                {shortcut.shortcut}
                                            </kbd>
                                        )}
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
