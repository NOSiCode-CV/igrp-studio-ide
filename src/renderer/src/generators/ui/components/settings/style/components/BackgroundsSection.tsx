import { BadgeCent as Gradient, Image, Layers, Palette } from 'lucide-react'
import { useState } from 'react'
import type { SectionProps } from '../types'
import { BackgroundList } from './backgrounds/BackgroundList'
import type { BackgroundStyle } from './effects/types'

export function BackgroundsSection({ onChangeStyles, styles }: SectionProps) {
    const [backgrounds, setBackgrounds] = useState<BackgroundStyle[]>(
        styles.backgrounds || [
            {
                type: 'color',
                value: '#FFFFFF',
                size: 'cover',
                position: 'center',
                repeat: 'no-repeat',
                attachment: 'scroll',
                blendMode: 'normal'
            }
        ]
    )
    const [editingIndex, setEditingIndex] = useState<number | null>(null)

    const addBackground = (type: 'color' | 'image' | 'gradient') => {
        const newBackground: BackgroundStyle = {
            type,
            value:
                type === 'color'
                    ? '#FFFFFF'
                    : type === 'image'
                      ? ''
                      : {
                            type: 'linear',
                            angle: '90',
                            stops: [
                                { color: '#FFFFFF', position: '0' },
                                { color: '#000000', position: '100' }
                            ]
                        },
            size: 'cover',
            position: 'center',
            repeat: 'no-repeat',
            attachment: 'scroll',
            blendMode: 'normal'
        }

        const updatedBackgrounds = [...backgrounds, newBackground]
        setBackgrounds(updatedBackgrounds)
        onChangeStyles({ backgrounds: updatedBackgrounds })
    }

    const removeBackground = (index: number) => {
        const updatedBackgrounds = backgrounds.filter((_, i) => i !== index)
        setBackgrounds(updatedBackgrounds)
        onChangeStyles({ backgrounds: updatedBackgrounds })

        if (editingIndex === index) {
            setEditingIndex(null)
        } else if (editingIndex !== null && editingIndex > index) {
            setEditingIndex(editingIndex - 1)
        }
    }

    const updateBackground = (index: number, background: BackgroundStyle) => {
        const updatedBackgrounds = backgrounds.map((bg, i) => (i === index ? background : bg))
        setBackgrounds(updatedBackgrounds)
        onChangeStyles({ backgrounds: updatedBackgrounds })
    }

    const backgroundTypes = [
        { type: 'color', icon: <Palette size={14} />, title: 'Add color' },
        { type: 'image', icon: <Image size={14} />, title: 'Add image' },
        {
            type: 'gradient',
            icon: <Gradient size={14} />,
            title: 'Add gradient'
        }
    ] as const

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Layers size={14} />
                    Backgrounds
                </h3>
                <div className="flex items-center gap-1">
                    {backgroundTypes.map(({ type, icon, title }) => (
                        <button
                            key={type}
                            onClick={() => addBackground(type)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title={title}
                            aria-label={title}
                        >
                            {icon}
                        </button>
                    ))}
                </div>
            </div>

            <BackgroundList
                backgrounds={backgrounds}
                editingIndex={editingIndex}
                onEdit={setEditingIndex}
                onRemove={removeBackground}
                onChange={updateBackground}
            />
        </div>
    )
}
