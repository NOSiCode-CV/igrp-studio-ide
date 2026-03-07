import { FormList } from '../../../../components/form-list'
import type { IColumnsTabelProps } from '../../types/Interfaces'

interface AttributesCardProps {
    columns: IColumnsTabelProps[]
    formik: any
    data: any[] | []
    errors: any
    addRow: () => void
    removeRow: (value: number) => void
    changeValue: (element: string, position: number, value: any) => void
}

const AttributesCard = ({
    columns,
    formik,
    data,
    errors,
    addRow,
    removeRow,
    changeValue
}: AttributesCardProps) => {
    return (
        <FormList
            errors={errors}
            formik={formik}
            columns={columns}
            data={data}
            changeValue={changeValue}
            addRow={addRow}
            removeRow={removeRow}
            btnLabels={'Attribute'}
            name={'attributes'}
        />
    )
}
export default AttributesCard
