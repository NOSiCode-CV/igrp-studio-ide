export interface IColumnsTabelProps {
    key: string
    name: string
    type: string
    options?: any
    width?: string
    readonly?: boolean
    items?: IColumnsTabelProps[]
    dependsOn?: string
    getOptions?: (value: number) => Array<any>
}

/**
 * Minimal form contract that BindingFormList relies on for nested-array
 * writes. Both Formik (`useFormik(...)` directly) and React Hook Form
 * (via `toRowFormAdapter` from `@renderer/lib/form`) satisfy this shape.
 */
export interface BindingFormController {
    setFieldValue: (field: string, value: any) => void | Promise<unknown>
    values?: any
}

export interface ITabelContainer {
    data: any[]
    formik: BindingFormController
    errors?: any
    touched?: any
    changeValue: (element: string, position: number, value: any) => void
    addRow?: () => void
    removeRow?: (value: number) => void
    columns: IColumnsTabelProps[]
    name: string
    btnLabels?: string
}
