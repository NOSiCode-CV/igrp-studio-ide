import { ENV_TYPES } from '@renderer/constants/appConstants'
import { buildDtoEngineConfig } from './config'

describe('buildDtoEngineConfig', () => {
    const values: any = {
        type: 'dto',
        name: 'DepartmentResponse',
        module: 'ignored-by-boundary',
        template: 'classic',
        enableCustonValidation: false,
        readOnly: false,
        extends: { name: '', module: '' },
        attributes: [{ name: 'id', type: 'integer' }]
    }

    it('maps the shared attributes form to Django fields and strips UI-only keys', () => {
        expect(buildDtoEngineConfig(values, ENV_TYPES.DJANGO, 'Departments', 'dto-id')).toEqual({
            type: 'dto',
            name: 'DepartmentResponse',
            module: 'Departments',
            fields: [{ name: 'id', type: 'integer' }]
        })
    })

    it('preserves the existing non-Django payload shape', () => {
        expect(buildDtoEngineConfig(values, ENV_TYPES.DOTNET, 'Departments', 'dto-id')).toEqual({
            ...values,
            module: 'Departments',
            id: 'dto-id'
        })
    })
})
