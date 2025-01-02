import Illustration from "@renderer/components/ilustration"
import { formatMethods } from "../../helpers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@renderer/components/ui/table";
import { Badge } from "@renderer/components/ui/badge";
import { Combobox } from '@igrp/igrp-design-system'

const PrimaryKeyTable = ({ validation, selectors }) => {

    const primaryKeys = validation.values.attributes
        .filter(attribute => attribute.primaryKey === true)
        .map(({ name, type }) => ({
            name,
            type
        }));

    const generateTypes = formatMethods(
        (
            selectors.find((selector) => 'GENERATION_TYPES' in selector) as
            | { GENERATION_TYPES: string[] }
            | undefined
        )?.GENERATION_TYPES || []
    )

    const selectValue = generateTypes?.filter((d) => d.value === validation.values.generationType)[0]?.value;

    return (
        <Table>
            <TableHeader className="ps-4">
                <TableRow>
                    <TableHead className="w-1/4 ps-4">
                        <div className="">Generation Type</div>
                    </TableHead>
                    <TableHead>
                        <div className="gap-2 flex align-middle">
                            <span>Primary Key Fields</span>
                            <Illustration name="info" />
                        </div>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell className="ps-4">

                        <Combobox
                            name={'generationType'}
                            placeholder={`Select ${name}`}
                            options={generateTypes}
                            value={selectValue}
                            onChange={(selectedOption) => {
                                validation.setFieldValue('generationType', selectedOption)
                            }} />

                    </TableCell>
                    <TableCell className="align-middle">
                        <div className="flex gap-2">
                            {primaryKeys && primaryKeys.map(({ name }, key) => (
                                <Badge key={key} className="bg-light text-gray-500 italic fw-normal p-2 pe-3 ps-3 uppercase">
                                    {name}
                                </Badge>
                            ))}
                        </div>
                    </TableCell>

                </TableRow>
            </TableBody>
        </Table>
    )
}
export default PrimaryKeyTable