// shortcutConstants.ts

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

const SHORTCUTS = {
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

  CLOSE_SIDEBAR: isMac ? '⌘ b' : 'Ctrl+b',

  // Novos atalhos para o editor de código e gerais
  FIND: isMac ? '⌘ F' : 'Ctrl+F',
  REPLACE: isMac ? '⌥ ⌘ F' : 'Ctrl+Alt+F',
  SETTINGS: isMac ? '⌘ ,' : 'Ctrl+,',
  ZOOM_IN: isMac ? '⌘ =' : 'Ctrl+=',
  ZOOM_OUT: isMac ? '⌘ -' : 'Ctrl+-',
  OPEN_SHORTCUT_HELP: isMac ? '⌘ /' : 'Ctrl+/',

  // Workspace shortcuts
  OPEN_WORKSPACE: isMac ? '⌘ O' : 'Ctrl+O',
  NEW_WORKSPACE: isMac ? '⌘ N' : 'Ctrl+N',
  SWITCH_WORKSPACE_1: isMac ? '⌘ 1' : 'Ctrl+1',
  SWITCH_WORKSPACE_2: isMac ? '⌘ 2' : 'Ctrl+2',
  SWITCH_WORKSPACE_3: isMac ? '⌘ 3' : 'Ctrl+3',
  SWITCH_WORKSPACE_4: isMac ? '⌘ 4' : 'Ctrl+4',
  SWITCH_WORKSPACE_5: isMac ? '⌘ 5' : 'Ctrl+5',
  SWITCH_WORKSPACE_6: isMac ? '⌘ 6' : 'Ctrl+6',
  SWITCH_WORKSPACE_7: isMac ? '⌘ 7' : 'Ctrl+7',
  SWITCH_WORKSPACE_8: isMac ? '⌘ 8' : 'Ctrl+8',
  SWITCH_WORKSPACE_9: isMac ? '⌘ 9' : 'Ctrl+9'
}

enum KeyboardKey {
  escape = 'Escape',
  enter = 'Enter',
  find = 'f',
  model = 'm',
  endpoint = 'e',
  dto = 'o',
  open = 'o',
  new = 'n',
  save = 's',
  one = '1',
  two = '2',
  three = '3',
  four = '4',
  five = '5',
  six = '6',
  seven = '7',
  eight = '8',
  nine = '9'
}

export { KeyboardKey, SHORTCUTS }
