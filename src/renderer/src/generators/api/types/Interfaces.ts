export interface IColumnsTabelProps {
  key: string
  name: string
  type: string
  options?: any
  width?: string
  items?: IColumnsTabelProps[]
  dependsOn?: string,
  getOptions?: (value: number) => Array<any>
}

export interface ITabelContainer {
  data: any[]
  formik: any
  errors?: any
  touched?: any
  changeValue: (element: string, position: number, value: any) => void
  addRow?: () => void
  removeRow?: (value: number) => void
  columns: IColumnsTabelProps[]
  name: string
  btnLabels?: string
}