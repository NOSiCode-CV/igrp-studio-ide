import {
    type BackgroundStyle,
    backgroundAttachments,
    backgroundPositions,
    backgroundRepeats,
    backgroundSizes,
    blendModes
} from '../../effects/types'

interface CommonControlsProps {
    background: BackgroundStyle
    onChange: (background: BackgroundStyle) => void
}

export function CommonControls({ background, onChange }: CommonControlsProps) {
    return (
        <>
            <div className="grid grid-cols-2 gap-1">
                <div className="space-y-0.5">
                    <label className="text-xs text-gray-500">Size</label>
                    <select
                        value={background.size}
                        onChange={(e) => onChange({ ...background, size: e.target.value })}
                        className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                    >
                        {backgroundSizes.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-0.5">
                    <label className="text-xs text-gray-500">Position</label>
                    <select
                        value={background.position}
                        onChange={(e) =>
                            onChange({
                                ...background,
                                position: e.target.value
                            })
                        }
                        className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                    >
                        {backgroundPositions.map((position) => (
                            <option key={position} value={position}>
                                {position}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-1">
                <div className="space-y-0.5">
                    <label className="text-xs text-gray-500">Repeat</label>
                    <select
                        value={background.repeat}
                        onChange={(e) => onChange({ ...background, repeat: e.target.value })}
                        className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                    >
                        {backgroundRepeats.map((repeat) => (
                            <option key={repeat} value={repeat}>
                                {repeat}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-0.5">
                    <label className="text-xs text-gray-500">Attachment</label>
                    <select
                        value={background.attachment}
                        onChange={(e) =>
                            onChange({
                                ...background,
                                attachment: e.target.value
                            })
                        }
                        className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                    >
                        {backgroundAttachments.map((attachment) => (
                            <option key={attachment} value={attachment}>
                                {attachment}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-0.5">
                <label className="text-xs text-gray-500">Blend Mode</label>
                <select
                    value={background.blendMode}
                    onChange={(e) => onChange({ ...background, blendMode: e.target.value })}
                    className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                >
                    {blendModes.map((mode) => (
                        <option key={mode} value={mode}>
                            {mode}
                        </option>
                    ))}
                </select>
            </div>
        </>
    )
}
