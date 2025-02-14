// shortcutConstants.ts

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

export const SHORTCUTS = {
    // Atalhos existentes
    NEW_MODEL: isMac ? '⌘ M' : 'Ctrl+M',
    NEW_CONTROLLER: isMac ? '⌘ E' : 'Ctrl+E',
    NEW_DTO: isMac ? '⌘ O' : 'Ctrl+O',
    NEW_PROJECT: isMac ? '⌘ N' : 'Ctrl+N',
    SAVE: isMac ? '⌘ S' : 'Ctrl+S',
    DELETE: 'Delete',
    CLOSE_TAB: isMac ? '⌘ W' : 'Ctrl+W',
    FORCE_QUIT_TAB: isMac ? '⌘ ⌥ W' : 'Ctrl+Alt+W',
    SWITCH_TO_NEXT_TAB: isMac ? ['⌘ ⌥ →', '⌘ ⇧ ]'] : ['Ctrl+Alt+Right', 'Ctrl+Shift+]'],
    SWITCH_TO_PREVIOUS_TAB: isMac ? ['⌘ ⌥ ←', '⌘ ⇧ ['] : ['Ctrl+Alt+Left', 'Ctrl+Shift+['],
    JUMP_TO_SPECIFIC_TAB: isMac ? '⌘ 1-8' : 'Ctrl+1-8',
    JUMP_TO_LAST_TAB: isMac ? '⌘ 9' : 'Ctrl+9',

    // Novos atalhos para o editor de código e gerais
    FIND: isMac ? '⌘ F' : 'Ctrl+F',
    REPLACE: isMac ? '⌥ ⌘ F' : 'Ctrl+Alt+F',
    SETTINGS: isMac ? '⌘ ,' : 'Ctrl+,',
    ZOOM_IN: isMac ? '⌘ =' : 'Ctrl+=',
    ZOOM_OUT: isMac ? '⌘ -' : 'Ctrl+-',
    OPEN_SHORTCUT_HELP: isMac ? '⌘ /' : 'Ctrl+/',
};