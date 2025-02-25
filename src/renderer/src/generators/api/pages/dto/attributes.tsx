import { FormList } from '../../components/form-list';
import { IColumnsTabelProps } from '../../types/Interfaces';

interface AttributesCardProps {
    columns: IColumnsTabelProps[];
    formik: any;
    currentDto: string;
    selectors: any;
    data: any[] | [];
    errors: any;
    dto: any;
    models: any;
    addRow: () => void;
    removeRow: (value: number) => void;
    changeValue: (element: string, position: number, value: any) => void;
}

const AttributesCard = ({
    columns,
    formik,
    data,
    errors,
    addRow,
    removeRow,
    changeValue,
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
    );
};
export default AttributesCard;
