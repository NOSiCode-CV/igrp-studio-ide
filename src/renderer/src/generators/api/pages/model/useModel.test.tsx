/**
 * @jest-environment jsdom
 *
 * Regression for the Ctrl+S validation-bypass fix: the normal Save-button
 * path goes through `<form onSubmit={formik.handleSubmit}>` (see
 * `pages/model/index.tsx`), which runs the RHF/Zod resolver (including the
 * `uniqueConstraints` duplicate-name superRefine, see `validation.ts`)
 * before invoking `handleSave`. The keyboard shortcut used to call
 * `handleSave()` directly, skipping that resolver entirely. The fix routes
 * both paths through the exact same `formik.handleSubmit` function.
 *
 * These tests exercise the REAL `useModel` hook, the REAL `useZodForm` /
 * `useFormikCompat` (`@renderer/lib/form`) and the REAL `useModelValidation`
 * Zod schema — only the hook's external dependencies (tabs, git, studio API,
 * framework, toast, redux, i18n) are mocked, so the validation-gating logic
 * itself is never reimplemented or bypassed in the test.
 */
import { act, renderHook, waitFor } from '@testing-library/react'

jest.mock('@renderer/components/navigation/TabContext', () => ({
    useTabs: () => ({
        initializeTabFromCurrentItem: jest.fn(),
        handleRenameTab: jest.fn()
    })
}))

jest.mock('@renderer/hooks/use-git', () => ({
    useGit: () => ({ createGitCommit: jest.fn().mockResolvedValue(true) })
}))

jest.mock('@renderer/hooks/use-framework', () => ({
    useFramework: () => 'dotnet'
}))

jest.mock('@renderer/hooks/useToast', () => ({
    __esModule: true,
    default: () => ({
        showSuccessToast: jest.fn(),
        showErrorToast: jest.fn(),
        showWarningToast: jest.fn()
    })
}))

jest.mock('react-redux', () => ({
    useDispatch: () => jest.fn()
}))

jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

const getJsonDataMock = jest.fn()
// Stable references — a fresh object/array literal returned on every mock
// call changes identity every render, feeding an unstable dependency into
// useModel's own `useEffect([config])` / `useEffect([selectors, ..., models])`
// and causing a "Maximum update depth exceeded" infinite render loop (the
// exact same failure class as `selectors: []` below, just triggered from
// inside this test's mocks instead of from the call site).
const stableModels: unknown[] = []
const stableConfig = { config: { enableEntityRevision: false } }

jest.mock('@renderer/hooks/use-studio-api', () => ({
    __esModule: true,
    default: () => ({
        models: stableModels,
        basePath: '/tmp/project',
        config: stableConfig,
        enums: [],
        findModelsByName: jest.fn(),
        getJsonData: (...args: unknown[]) => getJsonDataMock(...args)
    })
}))

// biome-ignore lint/suspicious/noExplicitAny: test-only require after jest.mock hoisting
const { useModel } = require('./useModel')

const currentItem = { id: 'model-1', path: '/tmp/project/Widget.json', module: 'shared' }
// Must be referentially stable across renders — a fresh `[]` literal on every
// render feeds an unstable dependency into useModel's `useEffect([selectors,
// formik.values, models])`, causing an infinite re-render loop.
const stableSelectors: unknown[] = []

const baseModelData = (uniqueConstraints: Array<{ name: string; columns: string[] }>) => ({
    revision: false,
    audit: false,
    name: 'Widget',
    tableName: 'widgets',
    attributes: [],
    primaryKey: [],
    crud: false,
    uniqueConstraints,
    indexes: []
})

const duplicateConstraints = [
    { name: 'uq_test', columns: ['a'] },
    { name: 'uq_test', columns: ['b'] }
]
const distinctConstraints = [
    { name: 'uq_a', columns: ['a'] },
    { name: 'uq_b', columns: ['b'] }
]

const dispatchCtrlS = () => {
    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true })
    act(() => {
        document.dispatchEvent(event)
    })
}

describe('useModel: keyboard save (Ctrl+S) and button save share the same validation gate', () => {
    beforeEach(() => {
        jest.resetAllMocks()
        ;(window as unknown as { engine: { createModel: jest.Mock } }).engine = {
            createModel: jest.fn().mockResolvedValue({ error: null })
        }
        ;(window as unknown as { api: Record<string, jest.Mock> }).api = {
            getJsonContent: jest.fn().mockResolvedValue({})
        }
    })

    it('duplicate unique-constraint names + button save (formik.handleSubmit) is blocked', async () => {
        getJsonDataMock.mockResolvedValue(baseModelData(duplicateConstraints))
        const { result } = renderHook(() => useModel({ selectors: stableSelectors, currentItem }))

        await waitFor(() => {
            expect(result.current.formik.values.uniqueConstraints).toEqual(duplicateConstraints)
        })

        await act(async () => {
            await result.current.formik.handleSubmit()
        })

        expect(window.engine.createModel).not.toHaveBeenCalled()
    })

    it('duplicate unique-constraint names + Ctrl+S is blocked', async () => {
        getJsonDataMock.mockResolvedValue(baseModelData(duplicateConstraints))
        const { result } = renderHook(() => useModel({ selectors: stableSelectors, currentItem }))

        await waitFor(() => {
            expect(result.current.formik.values.uniqueConstraints).toEqual(duplicateConstraints)
        })

        dispatchCtrlS()
        await waitFor(() => {
            expect(window.engine.createModel).not.toHaveBeenCalled()
        })
    })

    it('valid model (distinct constraint names) + button save (formik.handleSubmit) succeeds', async () => {
        getJsonDataMock.mockResolvedValue(baseModelData(distinctConstraints))
        const { result } = renderHook(() => useModel({ selectors: stableSelectors, currentItem }))

        await waitFor(() => {
            expect(result.current.formik.values.uniqueConstraints).toEqual(distinctConstraints)
        })

        await act(async () => {
            await result.current.formik.handleSubmit()
        })

        expect(window.engine.createModel).toHaveBeenCalledTimes(1)
    })

    it('valid model (distinct constraint names) + Ctrl+S succeeds', async () => {
        getJsonDataMock.mockResolvedValue(baseModelData(distinctConstraints))
        const { result } = renderHook(() => useModel({ selectors: stableSelectors, currentItem }))

        await waitFor(() => {
            expect(result.current.formik.values.uniqueConstraints).toEqual(distinctConstraints)
        })

        dispatchCtrlS()
        await waitFor(() => {
            expect(window.engine.createModel).toHaveBeenCalledTimes(1)
        })
    })
})
