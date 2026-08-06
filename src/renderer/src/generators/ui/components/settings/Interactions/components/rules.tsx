import type {
    PermissionRuleDefinition,
    RuleDefinition,
    VisibilityRuleDefinition
} from '@igrp/igrp-studio-nextjs-engine/types'
import MonacoEditor, { type MonacoEditorHandle } from '@renderer/components/monaco-editor'
import { Button } from '@renderer/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@renderer/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@renderer/components/ui/select'
import { SidebarInset } from '@renderer/components/ui/sidebar'
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system'
import { usePermissionCatalog } from '@renderer/generators/ui/permission-catalog/PermissionCatalogContext'
import { PermissionPicker } from '@renderer/generators/ui/permission-catalog/permission-picker'
import type { PermissionKeySuggestionContext } from '@renderer/generators/ui/permission-catalog/suggestPermissionKey'
import useCustomCode from '@renderer/generators/ui/hooks/useCustomCode'
import useStudio from '@renderer/hooks/use-studio'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import {
    createEmptyPermissionRule,
    createEmptyVisibilityRule,
    createSimpleFallbackLayout,
    DEFAULT_DISABLED_PROP,
    DISABLED_PROP_HINTS,
    describePermissionRule,
    isPermissionRule,
    isVisibilityRule,
    moveRule,
    validateAndNormalizePermissionRule,
    validateAndNormalizeVisibilityRule
} from '@renderer/generators/ui/utils/permissionRules'
import type { State } from '@igrp/igrp-studio-nextjs-engine/types'
import { ArrowDown, ArrowUp, Edit, Key, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TabStates } from '../../../sidebar/custom-code/custom-code-tabs'

interface RulesProps {
    rules?: RuleDefinition[]
    isRootComponent: boolean
    ruleContext: StructuredComponent
    pageName?: string
    onRulesChange: (rules: RuleDefinition[]) => void
}

function buildPermissionKeyContext(
    ruleContext: StructuredComponent,
    pageName: string | undefined,
    projectName: string | undefined
): PermissionKeySuggestionContext {
    const content = ruleContext.properties?.content
    return {
        projectName,
        pageName,
        componentTag: ruleContext.tag,
        componentLabel: ruleContext.label,
        componentName: ruleContext.componentName,
        buttonContent: typeof content === 'string' ? content : undefined
    }
}

type EditorMode =
    | { kind: 'visibility'; index: number | null; draft: VisibilityRuleDefinition }
    | { kind: 'permission'; index: number | null; draft: PermissionRuleDefinition }

const Rules = ({
    rules = [],
    isRootComponent,
    ruleContext,
    pageName,
    onRulesChange
}: RulesProps) => {
    const { t } = useTranslation()
    const { config } = useStudio()
    const { ensureKeys, touchRecent } = usePermissionCatalog()
    const permissionKeyContext = useMemo(
        () => buildPermissionKeyContext(ruleContext, pageName, config?.name),
        [ruleContext, pageName, config?.name]
    )
    const [allRules, setAllRules] = useState<RuleDefinition[]>(rules)
    const [editor, setEditor] = useState<EditorMode | null>(null)
    const [formErrors, setFormErrors] = useState<string[]>([])

    useEffect(() => {
        setAllRules((prev) => {
            const next = rules ?? []
            if (
                prev.length === next.length &&
                prev.every((rule, i) => rule === next[i])
            ) {
                return prev
            }
            return next
        })
    }, [rules])

    const commitRules = (next: RuleDefinition[]) => {
        setAllRules(next)
        onRulesChange(next)
    }

    const openNewVisibility = () => {
        setFormErrors([])
        setEditor({ kind: 'visibility', index: null, draft: createEmptyVisibilityRule() })
    }

    const openNewPermission = () => {
        setFormErrors([])
        setEditor({ kind: 'permission', index: null, draft: createEmptyPermissionRule() })
    }

    const openEdit = (index: number) => {
        const rule = allRules[index]
        setFormErrors([])
        if (isVisibilityRule(rule)) {
            setEditor({ kind: 'visibility', index, draft: { ...rule } })
        } else if (isPermissionRule(rule)) {
            setEditor({
                kind: 'permission',
                index,
                draft: {
                    ...rule,
                    permission: [...(rule.permission ?? [])],
                    action: rule.action ?? 'hide'
                }
            })
        }
    }

    const removeRule = (index: number) => {
        commitRules(allRules.filter((_, i) => i !== index))
    }

    const move = (index: number, direction: -1 | 1) => {
        commitRules(moveRule(allRules, index, index + direction))
    }

    const saveEditor = () => {
        if (!editor) return

        if (editor.kind === 'visibility') {
            const result = validateAndNormalizeVisibilityRule(editor.draft.condition)
            if (!result.ok || !result.rule) {
                setFormErrors(result.errors)
                return
            }
            const next = [...allRules]
            if (editor.index === null) next.push(result.rule)
            else next[editor.index] = result.rule
            commitRules(next)
            setEditor(null)
            return
        }

        let draft = editor.draft

        const result = validateAndNormalizePermissionRule(draft, { isRoot: isRootComponent })
        if (!result.ok || !result.rule || !isPermissionRule(result.rule)) {
            setFormErrors(result.errors)
            return
        }
        const source = `${pageName ?? 'page'} / ${ruleContext.tag}`
        void ensureKeys(result.rule.permission ?? [], source)
        touchRecent(result.rule.permission ?? [])
        const next = [...allRules]
        if (editor.index === null) next.push(result.rule)
        else next[editor.index] = result.rule
        commitRules(next)
        setEditor(null)
    }

    return (
        <>
            <IGRPSeparator />
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                        <Key className="w-5 h-5" />
                        <h3 className="text-sm font-medium">{t('rules', 'Rules')}</h3>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t('addRule', 'Add rule')}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={openNewVisibility}>
                                {t('visibilityRule', 'Visibility')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={openNewPermission}>
                                {t('permissionRule', 'Permission')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {allRules.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                        {t(
                            'rulesEmptyHint',
                            'Add visibility or permission rules to gate this node.'
                        )}
                    </p>
                ) : (
                    <ul className="space-y-1.5">
                        {allRules.map((rule, index) => (
                            <li
                                key={`${rule.type}-${index}`}
                                className="flex items-center gap-1 rounded border px-2 py-1.5"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs font-medium capitalize">{rule.type}</div>
                                    <div className="truncate text-xs text-muted-foreground">
                                        {isVisibilityRule(rule)
                                            ? rule.condition || '—'
                                            : describePermissionRule(rule)}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    disabled={index === 0}
                                    onClick={() => move(index, -1)}
                                    aria-label={t('moveUp', 'Move up')}
                                >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    disabled={index === allRules.length - 1}
                                    onClick={() => move(index, 1)}
                                    aria-label={t('moveDown', 'Move down')}
                                >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={() => openEdit(index)}
                                    aria-label={t('edit', 'Edit')}
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={() => removeRule(index)}
                                    aria-label={t('delete', 'Delete')}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {editor?.kind === 'visibility' && (
                <VisibilityRuleEditor
                    open
                    draft={editor.draft}
                    errors={formErrors}
                    onChange={(draft) => setEditor({ ...editor, draft })}
                    onSave={saveEditor}
                    onClose={() => setEditor(null)}
                />
            )}

            {editor?.kind === 'permission' && (
                <PermissionRuleEditor
                    open
                    draft={editor.draft}
                    errors={formErrors}
                    isRootComponent={isRootComponent}
                    suggestionContext={permissionKeyContext}
                    onChange={(draft) => {
                        setFormErrors([])
                        setEditor({ ...editor, draft })
                    }}
                    onSave={saveEditor}
                    onClose={() => setEditor(null)}
                />
            )}
        </>
    )
}

const VisibilityRuleEditor = ({
    open,
    draft,
    errors,
    onChange,
    onSave,
    onClose
}: {
    open: boolean
    draft: VisibilityRuleDefinition
    errors: string[]
    onChange: (draft: VisibilityRuleDefinition) => void
    onSave: () => void
    onClose: () => void
}) => {
    const { t } = useTranslation()
    const editorRef = useRef<MonacoEditorHandle>(null)
    const { states } = useCustomCode()

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="p-0 flex overflow-hidden w-full sm:max-w-[800px] lg:max-w-[70vw] max-w-[90vw] max-h-[70vh]">
                <SidebarInset className="p-4 space-y-4 w-2/3">
                    <DialogHeader>
                        <div className="flex flex-1 justify-between gap-2">
                            <div className="space-y-2">
                                <DialogTitle>
                                    {t('visibilityRuleEditor', 'Visibility rule')}
                                </DialogTitle>
                                <DialogDescription>
                                    {t(
                                        'visibilityRuleEditorDesc',
                                        'Use states to control when this node is rendered.'
                                    )}
                                </DialogDescription>
                            </div>
                            <Button type="button" onClick={onSave}>
                                {t('save', 'Save')}
                            </Button>
                        </div>
                    </DialogHeader>
                    {errors.length > 0 && (
                        <ul className="text-sm text-destructive space-y-1">
                            {errors.map((err) => (
                                <li key={err}>{err}</li>
                            ))}
                        </ul>
                    )}
                    <MonacoEditor
                        content={draft.condition}
                        filePath=""
                        onChange={(code) => onChange({ ...draft, condition: code })}
                        height="5vh"
                        language="typescript"
                        ref={editorRef}
                    />
                    <p className="text-sm text-muted-foreground border rounded p-2 bg-muted">
                        {t(
                            'visibilityRuleHint',
                            'Examples: state1, state2 === "value", state1 && state2'
                        )}
                    </p>
                </SidebarInset>
                <div className="w-1/3 flex gap-4">
                    <IGRPSeparator orientation="vertical" />
                    <ScrollArea>
                        <div className="flex flex-col gap-4 py-4 pr-4 w-full">
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-bold mb-1">{t('states', 'States')}</h1>
                                <p className="text-muted-foreground text-sm">
                                    {t('statesHint', 'Click a state to insert it into the condition.')}
                                </p>
                            </div>
                            <TabStates
                                states={states}
                                onSelectState={(state: State) => {
                                    editorRef.current?.insertTextAtCursor(state.name)
                                }}
                            />
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}

const PermissionRuleEditor = ({
    open,
    draft,
    errors,
    isRootComponent,
    suggestionContext,
    onChange,
    onSave,
    onClose
}: {
    open: boolean
    draft: PermissionRuleDefinition
    errors: string[]
    isRootComponent: boolean
    suggestionContext?: PermissionKeySuggestionContext
    onChange: (draft: PermissionRuleDefinition) => void
    onSave: () => void
    onClose: () => void
}) => {
    const { t } = useTranslation()
    const [fallbackLabel, setFallbackLabel] = useState(
        () =>
            (draft.fallback?.properties as { content?: string } | undefined)?.content ??
            ''
    )

    const action = draft.action ?? 'hide'
    const permissions = draft.permission ?? []

    const setAction = (next: PermissionRuleDefinition['action']) => {
        const updated: PermissionRuleDefinition = {
            ...draft,
            action: next
        }
        if (next !== 'disable') delete updated.disabledProp
        if (next !== 'replace') {
            delete updated.fallback
            setFallbackLabel('')
        }
        onChange(updated)
    }

    const applyFallbackLabel = (label: string) => {
        setFallbackLabel(label)
        if (!label.trim()) {
            const { fallback: _removed, ...rest } = draft
            onChange(rest as PermissionRuleDefinition)
            return
        }
        onChange({
            ...draft,
            fallback: createSimpleFallbackLayout(label)
        })
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="sm:max-w-lg gap-0 overflow-hidden p-0">
                <ScrollArea className="max-h-[85vh]">
                    <div className="space-y-4 p-6">
                        <DialogHeader>
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                    <DialogTitle>
                                        {t('permissionRuleEditor', 'Permission rule')}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {t(
                                            'permissionRuleEditorDesc',
                                            'Gate this node by user permissions. Use bare suffixes (delete_invoice) or dept.suffix.'
                                        )}
                                    </DialogDescription>
                                </div>
                                <Button type="button" onClick={onSave}>
                                    {t('save', 'Save')}
                                </Button>
                            </div>
                        </DialogHeader>

                        {errors.length > 0 && (
                            <ul className="text-sm text-destructive space-y-1 rounded border border-destructive/30 bg-destructive/5 p-2">
                                {errors.map((err) => (
                                    <li key={err}>{err}</li>
                                ))}
                            </ul>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>
                                    {t('permissions', 'Permissions')}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <PermissionPicker
                                    value={permissions}
                                    suggestionContext={suggestionContext}
                                    onChange={(keys) => onChange({ ...draft, permission: keys })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t(
                                        'permissionConventionHint',
                                        'Bare suffix resolves against the active org; use dept.suffix for cross-department.'
                                    )}
                                </p>
                            </div>

                            {permissions.length >= 2 && (
                                <div className="space-y-2">
                                    <Label>{t('permissionMatch', 'Match')}</Label>
                                    <RadioGroup
                                        value={draft.mode ?? 'all'}
                                        onValueChange={(value) =>
                                            onChange({
                                                ...draft,
                                                mode: value as 'all' | 'any'
                                            })
                                        }
                                        className="flex gap-4"
                                    >
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="all" id="perm-mode-all" />
                                            <Label htmlFor="perm-mode-all" className="font-normal">
                                                {t('permissionMatchAll', 'All')}
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="any" id="perm-mode-any" />
                                            <Label htmlFor="perm-mode-any" className="font-normal">
                                                {t('permissionMatchAny', 'Any')}
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>{t('permissionAction', 'Action')}</Label>
                                <Select
                                    value={action}
                                    onValueChange={(v) => setAction(v as typeof action)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    {/* popper avoids item-aligned onPlaced loops inside Dialog */}
                                    <SelectContent position="popper">
                                        <SelectItem value="hide">
                                            {t('permissionActionHide', 'Hide')}
                                        </SelectItem>
                                        <SelectItem value="disable">
                                            {t('permissionActionDisable', 'Disable')}
                                        </SelectItem>
                                        <SelectItem value="replace">
                                            {t('permissionActionReplace', 'Replace with…')}
                                        </SelectItem>
                                        <SelectItem value="assert" disabled={!isRootComponent}>
                                            {t(
                                                'permissionActionAssert',
                                                'Assert (root only)'
                                            )}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {!isRootComponent && (
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'permissionAssertRootHint',
                                            'Assert is only available on page, component, or processStep roots.'
                                        )}
                                    </p>
                                )}
                            </div>

                            {action === 'disable' && (
                                <div className="space-y-2 rounded border p-3">
                                    <Label>{t('disabledProp', 'Bind to prop')}</Label>
                                    <Input
                                        list="disabled-prop-hints"
                                        value={draft.disabledProp ?? DEFAULT_DISABLED_PROP}
                                        onChange={(e) =>
                                            onChange({
                                                ...draft,
                                                disabledProp: e.target.value
                                            })
                                        }
                                        placeholder={DEFAULT_DISABLED_PROP}
                                    />
                                    <datalist id="disabled-prop-hints">
                                        {DISABLED_PROP_HINTS.map((hint) => (
                                            <option key={hint} value={hint} />
                                        ))}
                                    </datalist>
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'disabledPropHint',
                                            'Defaults to disabled. Leave as default to keep JSON clean.'
                                        )}
                                    </p>
                                </div>
                            )}

                            {action === 'replace' && (
                                <div className="space-y-2 rounded border p-3">
                                    <Label>
                                        {t('fallbackLabel', 'Fallback label')}
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        value={fallbackLabel}
                                        onChange={(e) => applyFallbackLabel(e.target.value)}
                                        placeholder={t(
                                            'fallbackLabelPlaceholder',
                                            'e.g. Request approval'
                                        )}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'fallbackM1Hint',
                                            'M1: creates a simple disabled ghost button. Full fallback canvas comes in M2.'
                                        )}
                                    </p>
                                    {draft.fallback && (
                                        <p className="text-xs text-muted-foreground">
                                            {t('fallbackSet', 'Fallback set')}:{' '}
                                            <code>{draft.fallback.componentName}</code>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

export default Rules
