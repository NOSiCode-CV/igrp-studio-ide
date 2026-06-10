import { Button } from '@renderer/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Edit2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BackgroundStyle } from '../effects/types'
import { ColorEditor } from './editors/ColorEditor'
import { CommonControls } from './editors/CommonControls'
import { GradientEditor } from './editors/GradientEditor'
import { ImageEditor } from './editors/ImageEditor'
import { getBackgroundStyles } from './utils'

interface BackgroundEditorProps {
    background: BackgroundStyle
    index: number
    onClose: () => void
    onRemove: () => void
    onChange: (background: BackgroundStyle) => void
    onEdit: () => void
}

export function BackgroundEditor({
    background,
    index,
    onClose,
    onChange,
    onEdit
}: BackgroundEditorProps) {
    const { t } = useTranslation()

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size={'icon'} onClick={onEdit}>
                    <Edit2 />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                            {t('editBackground')} {index + 1}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onClose()
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            <X size={10} />
                        </button>
                    </div>

                    {background.type === 'color' && (
                        <ColorEditor background={background} onChange={onChange} />
                    )}
                    {background.type === 'image' && (
                        <ImageEditor background={background} onChange={onChange} />
                    )}
                    {background.type === 'gradient' && (
                        <GradientEditor background={background} onChange={onChange} />
                    )}

                    <CommonControls background={background} onChange={onChange} />

                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        <div className="text-[9px] text-gray-500 mb-1">Preview</div>
                        <div
                            className="w-full h-12 rounded border border-gray-200 dark:border-gray-700"
                            style={getBackgroundStyles(background)}
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
