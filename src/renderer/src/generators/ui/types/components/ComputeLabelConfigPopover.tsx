import React, { useCallback, useMemo } from 'react'
import {
  IGRPButtonPrimitive,
  IGRPCombobox,
  IGRPPopoverPrimitive,
  IGRPPopoverTriggerPrimitive,
  IGRPPopoverContentPrimitive,
  IGRPOptionsProps,
  IGRPScrollAreaPrimitive,
  IGRPScrollBarPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { Settings } from 'lucide-react'

interface Field {
  name: string
  label: string
}

interface ComputeLabelConfigPopoverProps {
  fields: Field[]
  functionOptions: IGRPOptionsProps[]
  selectedComputeLabel: string | null
  selectedComputeLabelFunction: string | null
  onConfigureField: (value: string) => void
  onConfigureFunction: (value: string) => void
}

export const ComputeLabelConfigPopover: React.FC<ComputeLabelConfigPopoverProps> = ({
  fields,
  functionOptions,
  selectedComputeLabel,
  selectedComputeLabelFunction,
  onConfigureField,
  onConfigureFunction
}) => {
  const [popoverOpen, setPopoverOpen] = React.useState(false)

  // Transform fields to combobox options (cached)
  const fieldOptions = useMemo(() => {
    return fields.map((field) => ({
      value: field.name,
      label: field.label
    }))
  }, [fields])

  const handleFieldChange = useCallback(
    (value: string) => {
      onConfigureField(value)
      setPopoverOpen(false)
    },
    [onConfigureField]
  )

  const handleFunctionChange = useCallback(
    (value: string) => {
      onConfigureFunction(value)
      setPopoverOpen(false)
    },
    [onConfigureFunction]
  )

  // Determine button label
  const buttonLabel = useMemo(() => {
    if (selectedComputeLabelFunction) {
      return `Function: ${selectedComputeLabelFunction}`
    }
    if (selectedComputeLabel) {
      return `Label: ${selectedComputeLabel}`
    }
    return 'Configure Label'
  }, [selectedComputeLabel, selectedComputeLabelFunction])

  return (
    <IGRPPopoverPrimitive open={popoverOpen} onOpenChange={setPopoverOpen}>
      <IGRPPopoverTriggerPrimitive asChild>
        <IGRPButtonPrimitive
          variant="outline"
          size="sm"
          className="gap-2  from-primary-50 to-indigo-50 dark:from-primary-950/20 dark:to-indigo-950/20 border-primary-200 dark:border-primary-800 hover:from-primary-100 hover:to-indigo-100 dark:hover:from-primary-900/30 dark:hover:to-indigo-900/30 transition-all duration-200"
        >
          <Settings className="h-4 w-4" />
          {buttonLabel}
        </IGRPButtonPrimitive>
      </IGRPPopoverTriggerPrimitive>
      <IGRPPopoverContentPrimitive className="w-80" align="start">
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h4 className="font-medium text-sm mb-1">Compute Label Configuration</h4>
            <p className="text-xs text-muted-foreground">
              Select a field or custom function to compute the label for this list
            </p>
          </div>

          {/* Field Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Select Field</label>
            <IGRPCombobox
              options={fieldOptions}
              placeholder="Select a field"
              value={selectedComputeLabel || ''}
              onChange={(value) => handleFieldChange(value as string)}
            />
            {fields.length === 0 && (
              <p className="text-xs text-amber-600">
                No fields available. Add fields to the form first.
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-popover px-2 text-muted-foreground">OR</span>
            </div>
          </div>

          {/* Function Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Select Custom Function
            </label>
            <IGRPCombobox
              options={functionOptions}
              placeholder="Select a function"
              value={selectedComputeLabelFunction || ''}
              onChange={(value) => handleFunctionChange(value as string)}
            />

            {/* Function Implementation Example */}
            <div className="mt-2 p-3 bg-primary-50 dark:bg-primary-950/20 border border-primary-200  rounded-md space-y-2">
              <div>
                <p className="text-xs font-medium mb-1">How to implement this function:</p>
                <p className="text-xs text-muted-foreground">
                  Create this function in Custom Code section
                </p>
              </div>

              <IGRPScrollAreaPrimitive>
                <div className="bg-slate-900 dark:bg-slate-950 p-3 rounded border border-slate-700">
                  <code className="text-xs text-green-400 font-mono block whitespace-pre leading-relaxed">
                    {`function renderLabel(item: any, index: number): string {
    // Example: Combine fields to create label
    return \`\${item.name} - \${item.status}\`;
    
    // Or use index
    // return \`Item #\${index + 1}: \${item.title}\`;
}`}
                  </code>
                </div>
                <IGRPScrollBarPrimitive orientation="horizontal" />
              </IGRPScrollAreaPrimitive>

              <div className="flex items-start gap-1">
                <p className="text-xs text-muted-foreground">
                  Access item properties using{' '}
                  <code className="px-1 py-0.5 bg-primary-100 dark:bg-primary-900/30 rounded">
                    item.fieldName
                  </code>
                </p>
              </div>
            </div>

            {functionOptions.length === 0 && (
              <p className="text-xs text-amber-600">
                No custom functions available. Create one in Custom Code.
              </p>
            )}
          </div>
        </div>
      </IGRPPopoverContentPrimitive>
    </IGRPPopoverPrimitive>
  )
}
