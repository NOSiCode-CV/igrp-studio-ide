import { IColumnsTabelProps } from '../../types/Interfaces';

export const defaultValue = {
    name: '',
    code: '',
    description: '',
};

export const initialValues = {
    type: 'enum',
    module: '',
    name: '',
    values: [defaultValue],
    attributes: [],
};

export const getTablesColumns = (): {
    [value: string]: IColumnsTabelProps[];
} => {
    return {
        values: [
            { key: 'name', name: 'Name', type: 'text' },
            { key: 'code', name: 'Code', type: 'text' },
            { key: 'description', name: 'Description', type: 'text' },
        ],
    };
};
