import { formatMethods } from "../../helpers";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@renderer/components/ui/table";
import { Combobox } from "@renderer/components/combobox";
import { Button } from "@renderer/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { Input } from "@renderer/components/ui/input";
import { cn } from "@renderer/lib/utils";
import { OPTION_TYPE } from "@renderer/constants/appConstants";
import { NamespacesOptions } from './config'
import { useState } from "react";
import { PopoverDto } from "./popover-dto";
import { Checkbox } from "@renderer/components/ui/checkbox";
import { Label } from "@renderer/components/ui/label";

interface AttributesCardProps {
    currentDto: string,
    selectors: any,
    data: any[]
    errors: any
    dto: any,
    models: any,
    addRow: () => void
    removeRow: (value: number) => void
    changeValue: (element: string, position: number, value: any) => void
}

const AttributesCard = ({ selectors, data, errors, currentDto, dto, models, addRow, removeRow, changeValue }: AttributesCardProps) => {

    const paramsTypesData = formatMethods(
        (
            selectors.find((selector) => 'ATTRIBUTE_TYPES' in selector) as
            | { ATTRIBUTE_TYPES: string[] }
            | undefined
        )?.ATTRIBUTE_TYPES || []
    )

    const getOptions = (objects) => {
        return objects !== undefined ? objects
            .filter(m => m.name !== currentDto)
            .map(item => ({
                label: item.name,
                value: item.name
            })) : [];
    }

    const getUpdatedTypesForNamespace = (selectedValue) => {

        if (selectedValue === OPTION_TYPE.DATA_OBJECTS)
            return getOptions(dto)

        if (selectedValue === OPTION_TYPE.MODELS)
            return getOptions(models)

        return paramsTypesData
    }

    const handleDependentChange = (key, index, selectedValue) => {
        changeValue(key, index, selectedValue)

        const updatedOptions = getUpdatedTypesForNamespace(selectedValue);
        setDynamicOptions((prev) => ({
            ...prev,
            [selectedValue]: updatedOptions,
        }));
    };

    const [dynamicOptions, setDynamicOptions] = useState<Record<string, any[]>>({
        java: getUpdatedTypesForNamespace(""),
    });

    const toInitCap = (text) => 
        text.replace(/(?:^|\s|-)\S/g, (match) => match.toUpperCase());

    return (
        <Table>
            <TableHeader className="ps-4">
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>IsList?</TableHead>
                    <TableHead> </TableHead>
                    <TableHead style={{ width: "15px" }}></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length > 0 && data.map((row: any, index: number) => (
                    <TableRow key={index}>
                        <TableCell className="ps-4">
                            <Input
                                className={cn("text-sm", errors?.[index]?.['name'] ? 'border-red-500' : '')}
                                type="text"
                                value={row?.['name'] || ''}
                                onChange={(ev) => changeValue('name', index, ev.target.value)}
                            />
                        </TableCell>
                        <TableCell>
                            <Combobox
                                key={`${index}`}
                                name={'ns'}
                                placeholder={`Select Namespace`}
                                options={NamespacesOptions}
                                value={row?.['ns'] || ''}
                                onChange={(selectedOption) => {
                                    handleDependentChange('ns', index, selectedOption);
                                }} />
                        </TableCell>
                        <TableCell>
                            <Combobox
                                key={`${index}`}
                                name={'type'}
                                placeholder={`Select Type`}
                                options={dynamicOptions[row?.['ns']]}
                                value={row?.['type'] || ''}
                                onChange={(selectedOption) => {
                                    handleDependentChange('type', index, selectedOption);
                                }} />
                        </TableCell>
                        <TableCell>
                            <Checkbox
                                id={`${index}`}
                                onCheckedChange={(checked) =>
                                    changeValue('isList', index, checked)
                                }
                                checked={row?.['isList'] || false}
                            />
                        </TableCell>
                        <TableCell>
                            <PopoverDto key={index}>
                                {['required', 'isEmail', 'before', 'after', 'positive', 'isEmail', 'isUrl', 'primaryKey'].map((field) => (
                                    <div key={`${field}-${index}`} className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor={`${field}-${index}`}>{toInitCap(field)}</Label>
                                        <Checkbox
                                            id={`${field}-${index}`}
                                            onCheckedChange={(checked) =>
                                                changeValue(field, index, checked)
                                            }
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
                            </PopoverDto>
                        </TableCell>

                        <TableCell>
                            <Button
                                variant="outline" size="icon" className="border-0 text-red-500"
                                onClick={() => removeRow(index)}
                            >
                                <Trash />
                            </Button>
                        </TableCell>

                    </TableRow>
                ))}
            </TableBody>
            {addRow && (
                <TableFooter>
                    <TableRow>
                        <TableCell className="text-left">
                            <Button
                                variant={'outline'}
                                onClick={addRow}
                                className="text-capitalize"
                            >
                                <Plus />
                                {`New Attribute`}
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableFooter>
            )}
        </Table>
    )
}
export default AttributesCard