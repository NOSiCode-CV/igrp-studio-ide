import { Combobox } from '@renderer/components/combobox'
import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface PopoverDtoProps {
  children?: ReactNode
  index: number
  row: any
  collectionTypes: any[]
  changeValue: (element: string, position: number, value: any) => void
}

const toInitCap = (text) => text.replace(/(?:^|\s|-)\S/g, (match) => match.toUpperCase())

export function PopoverDto({ index, row, collectionTypes, changeValue }: PopoverDtoProps) {
  const { t } = useTranslation()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="link">Advanced</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end" side="bottom">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Tabs defaultValue="validations">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="validations"> {t('Validations')}</TabsTrigger>
                <TabsTrigger value="others"> {t('Others')}</TabsTrigger>
              </TabsList>

              <TabsContent value="validations">
                <p className="text-sm text-muted-foreground mb-3">
                  Set the validations for the data objects.
                </p>
                <div className="grid gap-2">
                  {['required', 'before', 'after', 'positive', 'isEmail', 'isUrl'].map((field) => (
                    <div key={`${field}-${index}`} className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor={`${field}-${index}`}>{toInitCap(field)}</Label>
                      <Checkbox
                        id={`${field}-${index}`}
                        onCheckedChange={(checked) => changeValue(field, index, checked)}
                        checked={row?.[field] || false}
                      />
                    </div>
                  ))}
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="minLength">Min Length</Label>
                    <Input
                      id="minLength"
                      defaultValue="0"
                      className="col-span-2 h-8"
                      value={row?.['minLength'] || ''}
                      onChange={(ev) => changeValue('minLength', index, ev.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="maxLength">Max Length</Label>
                    <Input
                      id="maxLength"
                      defaultValue="10"
                      className="col-span-2 h-8"
                      value={row?.['maxLength'] || ''}
                      onChange={(ev) => changeValue('maxLength', index, ev.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="regex">Regex</Label>
                    <Input
                      id="regex"
                      defaultValue="10"
                      className="col-span-2 h-8"
                      value={row?.['regex'] || ''}
                      onChange={(ev) => changeValue('regex', index, ev.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="others">
                <p className="text-sm text-muted-foreground mb-3">
                  Set the others settings for the data objects.
                </p>
                <div className="grid gap-2">
                  {['primaryKey'].map((field) => (
                    <div key={`${field}-${index}`} className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor={`${field}-${index}`}>{toInitCap(field)}</Label>
                      <Checkbox
                        id={`${field}-${index}`}
                        onCheckedChange={(checked) => changeValue(field, index, checked)}
                        checked={row?.[field] || false}
                      />
                    </div>
                  ))}{' '}
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="collectionType">Collection Type</Label>
                    <Combobox
                      key={`${index}`}
                      name={'collectionType'}
                      placeholder={`Select collection Type`}
                      options={collectionTypes}
                      value={row?.['collectionType'] || ''}
                      onChange={(selectedOption) => {
                        changeValue('collectionType', index, selectedOption)
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
