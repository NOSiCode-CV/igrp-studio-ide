import { Button } from '@renderer/components/ui/button'
import { SidebarHeader } from '@renderer/components/ui/sidebar'
import { RotateCcw, X } from 'lucide-react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

interface SidebarRightHeaderProps {
    componentName?: string
    showActions: boolean
    onReset: () => void
    onClose: () => void
}

const SidebarRightHeader = memo(function SidebarRightHeader({
    componentName,
    showActions,
    onReset,
    onClose
}: SidebarRightHeaderProps) {
    const { t } = useTranslation()

    return (
        <SidebarHeader>
            <div className="items-center justify-between flex flex-1">
                <div className="space-y-1">
                    <h4 className="text-sm font-medium leading-none">{t('settings')}</h4>
                    {componentName && <p className="text-sm text-muted-foreground"></p>}
                </div>
                <div className="flex items-center gap-2">
                    {showActions && (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onReset}
                                title={t('resetChanges')}
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button variant={'ghost'} onClick={onClose}>
                                <X />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </SidebarHeader>
    )
})

export default SidebarRightHeader
