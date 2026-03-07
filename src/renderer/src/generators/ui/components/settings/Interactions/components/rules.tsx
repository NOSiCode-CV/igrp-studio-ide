import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPScrollAreaPrimitive,
    IGRPSeparator,
    IGRPSidebarInsetPrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { RuleDefinition, State } from '@igrp/igrp-studio-nextjs-engine/types'
import MonacoEditor from '@renderer/components/monaco-editor'
import useCustomCode from '@renderer/generators/ui/hooks/useCustomCode'
import { capitalize } from '@renderer/utils'
import { Edit, Key } from 'lucide-react'
import { useRef, useState } from 'react'
import { TabStates } from '../../../sidebar/custom-code/custom-code-tabs'

interface RulesProps {
    rulesProperties: any
    componentTag: string
    rules: any
    onRulesChange: (rules: RuleDefinition[]) => void
}
const Rules = ({ rulesProperties, rules = [], onRulesChange }: RulesProps) => {
    const { items } = rulesProperties
    const { properties } = items || {}

    const hasRules = properties && properties.type.enum.length > 0

    const [open, setOpen] = useState(false)

    const [currentRule, setCurrentRule] = useState<string>('')
    const [currentRuleType, setCurrentRuleType] = useState<string>('')
    const [allRules, setAllRules] = useState<RuleDefinition[]>(rules)

    const onSave = () => {
        const rule = {
            type: currentRuleType as 'visibility',
            condition: currentRule
        }

        // Check if rule of same type exists
        const existingIndex = allRules.findIndex((r) => r.type === currentRuleType)

        const updatedRules = [...allRules]

        if (!currentRule?.trim()) {
            // Remove rule if currentRule is null or empty
            if (existingIndex !== -1) {
                updatedRules.splice(existingIndex, 1)
            }
        } else if (existingIndex !== -1) {
            // Update existing rule
            updatedRules[existingIndex] = rule
        } else {
            // Add new rule
            updatedRules.push(rule)
        }

        setAllRules(updatedRules)

        onRulesChange(updatedRules)

        setOpen(false)
    }

    return (
        <>
            {' '}
            {hasRules && (
                <>
                    <IGRPSeparator />
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                            <Key className="w-5 h-5" />

                            <h3 className="text-sm font-medium flex items-center gap-1">Rules</h3>
                        </div>

                        {properties &&
                            properties.type.enum.map((property: string, index: number) => (
                                <div className="flex items-center justify-between" key={index}>
                                    <h3 className="text-sm font-medium  flex items-center gap-1">
                                        {capitalize(property)}
                                    </h3>
                                    <div className="flex items-center gap-1">
                                        <IGRPButtonPrimitive
                                            variant={'ghost'}
                                            size={'icon'}
                                            onClick={() => {
                                                setOpen(true)
                                                setCurrentRuleType(property)

                                                const existingRule = allRules.find(
                                                    (r) => r.type === property
                                                )
                                                setCurrentRule(existingRule?.condition || '')
                                            }}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </IGRPButtonPrimitive>
                                    </div>
                                </div>
                            ))}
                    </div>
                    <RuleEditor
                        open={open}
                        setOpen={setOpen}
                        setCurrentRule={setCurrentRule}
                        currentRule={currentRule}
                        onSave={onSave}
                    />
                </>
            )}
        </>
    )
}

const RuleEditor = ({
    open,
    setOpen,
    setCurrentRule,
    currentRule,
    onSave
}: {
    open: boolean
    setOpen: (open: boolean) => void
    setCurrentRule: (condition: string) => void
    currentRule: string
    onSave: () => void
}) => {
    const editorRef = useRef<any>(null)

    const { states } = useCustomCode()

    const onSelectState = (state: State) => {
        editorRef.current.insertTextAtCursor(`${state.name}`)
    }

    return (
        <IGRPDialogPrimitive open={open} onOpenChange={setOpen}>
            <IGRPDialogContentPrimitive className="p-0 flex overflow-hidden [--header-height:calc(--spacing(99))] [--header-height-three:calc(--spacing(75))] w-full sm:max-w-[800px] lg:max-w-[70vw] max-w-[90vw] max-h-[70vh]">
                <IGRPSidebarInsetPrimitive className="p-4 space-y-4 w-2/3">
                    <IGRPDialogHeaderPrimitive>
                        <div className="flex flex-1 justify-between">
                            <div className="space-y-2">
                                <IGRPDialogTitlePrimitive>Rule Editor</IGRPDialogTitlePrimitive>
                                <IGRPDialogDescriptionPrimitive>
                                    Edit the rule for the property
                                </IGRPDialogDescriptionPrimitive>
                            </div>
                            <div>
                                {' '}
                                <IGRPButtonPrimitive type="submit" onClick={onSave}>
                                    Save
                                </IGRPButtonPrimitive>
                            </div>
                        </div>
                    </IGRPDialogHeaderPrimitive>
                    <MonacoEditor
                        content={currentRule}
                        filePath=""
                        onChange={(newCode) => setCurrentRule(newCode)}
                        height="5vh"
                        language="typescript"
                        ref={editorRef}
                    />
                    {/* Hint Text */}
                    <p className="text-sm text-muted-foreground border rounded p-2 bg-muted">
                        Use the states to control visibility or behavior of components. For example:
                        <br />
                        <code className="block text-xs mt-1 bg-background p-2 rounded border">
                            {'state1'}
                            <br />
                            {'state2 === "value"'}
                            <br />
                            {'state1 && state2'}
                        </code>
                    </p>
                </IGRPSidebarInsetPrimitive>
                <div className="w-1/3 flex gap-4">
                    <IGRPSeparator orientation="vertical" />
                    <IGRPScrollAreaPrimitive>
                        <div className="flex flex-col gap-4 py-4 pr-4 w-full">
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-bold mb-1">States</h1>
                                <p className="text-muted-foreground text-sm">
                                    Manage your parameters below.
                                </p>
                            </div>
                            <TabStates
                                states={states}
                                onSelectState={(state) => {
                                    onSelectState(state)
                                }}
                            />
                        </div>
                    </IGRPScrollAreaPrimitive>
                </div>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    )
}

export default Rules
