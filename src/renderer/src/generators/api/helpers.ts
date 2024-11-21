import { OptionType } from '@renderer/constants/appConstants';
import { FormikValues } from 'formik';

export function formatMethods(elements: string[]): { label: string; value: string }[] {
  return elements.map((element) => ({
    label: element,
    value: element,
  }));
}

export const addNewRow = (
  formik: FormikValues,
  field: string,
  defaultValue: any
): void => {
  formik.setFieldValue(field, [...formik.values[field], defaultValue]);
};

export const removeRow = (
  formik: FormikValues,
  field: string,
  position: number
): void => {
  formik.setFieldValue(
    field,
    formik.values[field].filter((_: any, index: number) => index !== position)
  );
};

export const changeValue = (
  formik: FormikValues,
  element: string,
  position: number,
  value: any,
  field: string
): void => {
  formik.setFieldValue(
    field,
    formik.values[field].map((row: any, index: number) =>
      index === position ? { ...row, [element]: value } : row
    )
  );
};


export const extractByType = (moduleData: any, type: OptionType) => {

  const files = moduleData?.files ?? [];

  return files.find((item: any) => item[type])?.[type] ?? [];
};