import { Trash2 } from 'lucide-react'
import type { BackgroundStyle, GradientValue } from '../../effects/types'

interface GradientEditorProps {
  background: BackgroundStyle
  onChange: (background: BackgroundStyle) => void
}

export function GradientEditor({ background, onChange }: GradientEditorProps) {
  const gradient = background.value as GradientValue

  const updateGradient = (updates: Partial<GradientValue>) => {
    onChange({
      ...background,
      value: { ...gradient, ...updates }
    })
  }

  const updateStop = (index: number, color: string, position: string) => {
    const newStops = [...gradient.stops]
    newStops[index] = { color, position }
    updateGradient({ stops: newStops })
  }

  const addStop = () => {
    if (gradient.stops.length >= 5) return
    const newStops = [...gradient.stops]
    const lastStop = newStops[newStops.length - 1]
    const secondLastStop = newStops[newStops.length - 2]
    const position = Math.min(
      100,
      Number(lastStop.position) + (Number(lastStop.position) - Number(secondLastStop.position))
    )
    newStops.push({ color: '#808080', position: position.toString() })
    updateGradient({ stops: newStops })
  }

  const removeStop = (index: number) => {
    if (gradient.stops.length <= 2) return
    const newStops = gradient.stops.filter((_, i) => i !== index)
    updateGradient({ stops: newStops })
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1">
        <div className="space-y-0.5">
          <label className="text-xs text-gray-500">Type</label>
          <select
            value={gradient.type}
            onChange={(e) =>
              updateGradient({
                type: e.target.value as 'linear' | 'radial' | 'conic'
              })
            }
            className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
            <option value="conic">Conic</option>
          </select>
        </div>
        <div className="space-y-0.5">
          <label className="text-xs text-gray-500">Angle</label>
          <input
            type="number"
            value={gradient.angle}
            onChange={(e) => updateGradient({ angle: e.target.value })}
            min="0"
            max="360"
            className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500">Color Stops</label>
          <button
            onClick={addStop}
            disabled={gradient.stops.length >= 5}
            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
          >
            Add Stop
          </button>
        </div>
        {gradient.stops.map((stop, index) => (
          <div key={index} className="flex items-center gap-1">
            <input
              type="color"
              value={stop.color}
              onChange={(e) => updateStop(index, e.target.value, stop.position)}
              className="w-8 h-[22px] rounded cursor-pointer"
            />
            <input
              type="number"
              value={stop.position}
              onChange={(e) => updateStop(index, stop.color, e.target.value)}
              min="0"
              max="100"
              className="w-14 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500">%</span>
            {gradient.stops.length > 2 && (
              <button
                onClick={() => removeStop(index)}
                className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
