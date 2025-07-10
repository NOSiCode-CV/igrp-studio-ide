import { httpStatusCodes } from '@renderer/constants/appConstants';
import * as Yup from 'yup'

export function useResponseValidation({ t }: { t: any }) {
    const validationSchema = Yup.object({
        statusCode: Yup.string()
            .required(t('httpStatusCodeRequired'))
            .oneOf(
                httpStatusCodes.map((code) => code.value),
                t('invalidHttpStatusCode')
            ),
        name: Yup.string()
            .required(t('nameRequired'))
            .max(50, t('nameMaxLength')),
    });


    return validationSchema;
}