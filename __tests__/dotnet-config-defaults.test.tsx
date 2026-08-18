/**
 * @jest-environment jsdom
 *
 * Regression tests for the .NET project-creation bug introduced by the
 * Formik→RHF migration: `handleChangeFramework` reset the wizard with
 * `config: {}`, which suppressed `DotNetConfig`'s `data = DEFAULT_DOTNET_CONFIG`
 * default parameter (it only fires for `undefined`). The submitted config then
 * lacked `database`/`projectStructureStyle`, `@igrp/dotnet-engine` rejected it,
 * and no `.igrpstudio/baseApi.json` was written — bricking every subsequent
 * add operation on the ghost project.
 */
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

jest.mock('@igrp/igrp-framework-react-design-system', () => ({
    IGRPCombobox: ({ value }: { value?: string }) => (
        <div data-testid="igrp-combobox">{String(value ?? '')}</div>
    )
}))

jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

import {
    DEFAULT_DOTNET_CONFIG,
    DotNetConfig
} from '../src/renderer/src/browser/project/components/configurations/dotnet-config'
import { useProjectValidation } from '../src/renderer/src/browser/project/validation'

describe('DotNetConfig defaults', () => {
    it('exposes every field the dotnet-engine baseApi schema requires', () => {
        // `newApi` requires artifact, database, projectStructureStyle,
        // enableObservability and enableEntityRevision (plus apiName derived
        // from name/artifact). The default config must carry all of them so
        // a freshly-seeded form can produce a valid engine payload.
        expect(DEFAULT_DOTNET_CONFIG).toEqual(
            expect.objectContaining({
                database: 'Postgresql',
                projectStructureStyle: 'technical',
                enableObservability: false,
                enableEntityRevision: false
            })
        )
        expect(DEFAULT_DOTNET_CONFIG).toHaveProperty('name')
        expect(DEFAULT_DOTNET_CONFIG).toHaveProperty('artifact')
    })

    it('renders engine defaults when data is undefined (default parameter)', () => {
        render(<DotNetConfig data={undefined as never} onChange={jest.fn()} />)

        expect(screen.getAllByTestId('igrp-combobox')[0]).toHaveTextContent('Postgresql')
        expect(screen.getByRole('radio', { name: 'technical' })).toBeChecked()
    })

    it('bundles the full default config into the first onChange', () => {
        // With `data` undefined, the first user interaction must emit the
        // defaults alongside the typed value — this is what guarantees
        // database/projectStructureStyle reach the form state even if the
        // user only fills name/artifact.
        const onChange = jest.fn()
        render(<DotNetConfig data={undefined as never} onChange={onChange} />)

        fireEvent.change(screen.getByPlaceholderText('enterProjectName'), {
            target: { value: 'crm' }
        })

        expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_DOTNET_CONFIG, name: 'crm' })
    })

    it('default config passes wizard validation once name and artifact are typed', () => {
        // Ties the component defaults to the step-2 schema: a user who picks
        // .NET (config seeded via getDefaultConfigByFramework) and types
        // name + artifact must reach the engine with a valid payload.
        const t = (key: string): string => key
        const schema = useProjectValidation({ t, step: 2 })

        const result = schema.safeParse({
            name: 'My Project',
            type: 'backend',
            framework: 'dotnet',
            path: 'C:/projects/crm',
            config: { ...DEFAULT_DOTNET_CONFIG, name: 'crm', artifact: 'crm-api' }
        })

        expect(result.success).toBe(true)
    })

    it('shows the inline validation message for each .NET config field', () => {
        render(
            <DotNetConfig
                data={{ ...DEFAULT_DOTNET_CONFIG }}
                errors={{
                    config: {
                        name: 'name-required',
                        artifact: 'artifact-required',
                        database: 'database-required',
                        projectStructureStyle: 'structure-required'
                    }
                }}
                onChange={jest.fn()}
            />
        )

        expect(screen.getByText('name-required')).toBeInTheDocument()
        expect(screen.getByText('artifact-required')).toBeInTheDocument()
        expect(screen.getByText('database-required')).toBeInTheDocument()
        expect(screen.getByText('structure-required')).toBeInTheDocument()
    })
})
