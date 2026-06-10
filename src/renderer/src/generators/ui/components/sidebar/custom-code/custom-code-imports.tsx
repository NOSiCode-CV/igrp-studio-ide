import { Button } from '@renderer/components/ui/button'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from '@renderer/components/ui/collapsible'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { IGRPBadge } from '@igrp/igrp-framework-react-design-system'
import type { Import } from '@igrp/igrp-studio-nextjs-engine/types'
import { nanoid } from '@reduxjs/toolkit'
import useToast from '@renderer/hooks/useToast'
import { cn } from '@renderer/lib/utils'
import { ChevronRight, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ImportComponentProps {
    onChange?: (imports: Import[]) => void
    initialImports?: Import[]
}

const ImportComponent = ({ onChange, initialImports = [] }: ImportComponentProps) => {
    const { t } = useTranslation()
    const [imports, setImports] = useState<Import[]>(initialImports)
    const [newImport, setNewImport] = useState<string>('')
    const [isOpen, setIsOpen] = useState(false)
    const { showWarningToast } = useToast()

    const parseImport = (input: string): Import | null => {
        const match = input.match(/import\s+\{?\s*([^}]*)\s*\}?\s+from\s+['"]([^'"]+)['"]/)
        if (!match) {
            showWarningToast('Invalid import')
            return null
        }

        return {
            id: `import_${nanoid(6).replace(/-/g, '')}`,
            namespace: input.trim()
        }
    }

    const addImport = (): void => {
        const parsed = parseImport(newImport)
        if (parsed && !imports.some((imp) => imp.namespace === parsed.namespace)) {
            setImports([...imports, parsed])
            onChange?.([...imports, parsed])
            setNewImport('')
        }
    }

    const removeImport = (id: string): void => {
        const unRemovedImports = imports.filter((imp) => imp.id !== id)
        setImports(unRemovedImports)
        onChange?.(unRemovedImports)
    }

    useEffect(() => {
        setImports(initialImports)
    }, [initialImports])

    return (
        <div className="space-y-2">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-2 p-0 h-auto hover:bg-transparent"
                        >
                            <ChevronRight
                                className={cn(
                                    'h-4 w-4 transition-transform',
                                    isOpen && 'rotate-90'
                                )}
                            />
                            <Label className="cursor-pointer">{t('imports.title')}</Label>
                        </Button>
                    </CollapsibleTrigger>
                    <IGRPBadge variant="outline" className="text-xs">
                        {t('imports.count', { count: imports.length })}
                    </IGRPBadge>
                </div>

                <CollapsibleContent>
                    <div className="border rounded-md p-3 space-y-2 mt-2">
                        {imports.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {imports.map((imp) => (
                                    <IGRPBadge
                                        key={imp.id}
                                        variant="soft"
                                        className="px-2 py-1 flex items-center gap-1"
                                    >
                                        <span className="font-mono text-sm">{imp.namespace}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 p-0 ml-1"
                                            onClick={() => removeImport(imp.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </IGRPBadge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-2">
                                {t('imports.empty')}
                            </p>
                        )}

                        <div className="flex gap-2">
                            <Input
                                value={newImport}
                                onChange={(e) => setNewImport(e.target.value)}
                                placeholder={t('imports.placeholder')}
                                className="h-8 flex-1"
                                onKeyDown={(e) => e.key === 'Enter' && addImport()}
                            />
                            <Button
                                type="button"
                                size="sm"
                                className="h-8"
                                onClick={addImport}
                                disabled={!newImport}
                            >
                                <Plus /> {t('add')}
                            </Button>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}

export { ImportComponent }
