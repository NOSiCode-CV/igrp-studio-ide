import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Label } from '@renderer/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { PackageCheck } from 'lucide-react'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toInitCap } from '../helpers'
import { Separator } from '@radix-ui/react-separator'

interface PopoverDtoProps {
  children?: ReactNode
  index: number
  row: any
  changeValue: (element: string, position: number, value: any) => void
}

export function PopoverComp({ index, row, changeValue }: PopoverDtoProps) {
  const { t } = useTranslation()

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="flex items-center" size={'icon'}>
              <PackageCheck className="w-4 h-4" /> {/* Settings icon */}
              <span className="sr-only">{t('Advanced')}</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          {t('Open advanced settings')}
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80" align="end" side="bottom">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Tabs defaultValue="dataType">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dataType"> {t('Data Type')}</TabsTrigger>
                <TabsTrigger value="jsonSchema"> {t('JSON Schema')}</TabsTrigger>
              </TabsList>

              <TabsContent value="dataType">
                <p className="text-sm text-muted-foreground mb-3">
                  Set the Data type for the query parameter.
                </p>
                <div className="grid gap-2">
                  {['isRequired', 'nullable', 'deprecated'].map((field) => (
                    <div key={`${field}-${index}`} className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor={`${field}-${index}`}>{toInitCap(field)}</Label>
                      <Checkbox
                        id={`${field}-${index}`}
                        onCheckedChange={(checked) => changeValue(field, index, checked)}
                        checked={row?.[field] || false}
                      />
                    </div>
                  ))}
                </div>
                <Separator orientation='horizontal'/>
                <div className="grid gap-2">
                  {['emun', 'const'].map((field) => (
                    <div key={`${field}-${index}`} className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor={`${field}-${index}`}>{toInitCap(field)}</Label>
                      <Checkbox
                        id={`${field}-${index}`}
                        onCheckedChange={(checked) => changeValue(field, index, checked)}
                        checked={row?.[field] || false}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="jsonSchema"></TabsContent>
            </Tabs>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
