import Illustration from "@renderer/components/Ilustration"
import { Badge, Table } from "reactstrap"
import Select from 'react-select'
import { formatMethods } from "../../helpers";

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

    return (
        <Table borderless>
            <thead>
                <tr className="bg-light">
                    <th className="text-muted ps-4 w-25">
                        <div className="text-success fw-normal">Generation Type</div>
                    </th>
                    <th className="text-muted">
                        <div className="text-success fw-normal d-flex align-items-center gap-2">
                            Primary Key Fields
                            <div style={{ marginTop: '5px' }}>
                                <Illustration name="info" />
                            </div>
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr className="bg-white">
                    <td className="ps-4">
                        <Select
                            id="generationType"
                            name="generationType"
                            options={generateTypes}
                            onBlur={validation.generationType}
                            onChange={(selectedOption) => {
                                validation.setFieldValue('generationType', selectedOption.value)
                            }}
                            value={generateTypes?.filter((d) => d.value === validation.values.generationType)}
                        />
                    </td>
                    <td className="align-middle">
                        <div className="d-flex gap-2">
                            {primaryKeys && primaryKeys.map(({ name }, key) => (
                                <Badge key={key} className="bg-light text-muted fst-italic fw-normal p-2 pe-3 ps-3 fs-5 text-uppercase">
                                    {name}
                                </Badge>
                            ))}
                        </div>
                    </td>

                </tr>
            </tbody>
        </Table>
    )
}
export default PrimaryKeyTable