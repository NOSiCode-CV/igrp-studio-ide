import { httpStatusCodes } from '@renderer/constants/appConstants'
import { z } from 'zod'

export function useResponseValidation({ t }: { t: any }) {
    const statusValues = httpStatusCodes.map((code) => code.value) as readonly string[]
    return z
        .object({
            statusCode: z
                .string()
                .min(1, t('httpStatusCodeRequired'))
                .refine((v) => statusValues.includes(v), t('invalidHttpStatusCode')),
            name: z.string().min(1, t('nameRequired')).max(50, t('nameMaxLength'))
        })
        .passthrough()
}
