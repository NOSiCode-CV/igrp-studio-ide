/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'

// Hold a ref to the mock mutateAsync so each test can intercept calls.
const mutateAsyncMock = jest.fn<Promise<unknown>, [{ xml: string }]>()
let pendingResolvers: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = []

jest.mock('./useSaveProcessDiagram', () => ({
    useSaveProcessDiagram: () => ({
        mutateAsync: mutateAsyncMock,
        isPending: false,
        error: null
    })
}))

import { useAutoSaveDiagram } from './useAutoSaveDiagram'

beforeEach(() => {
    jest.useFakeTimers()
    mutateAsyncMock.mockReset()
    pendingResolvers = []
    // Default: each call returns a manually-resolved promise so we can model
    // an in-flight save explicitly.
    mutateAsyncMock.mockImplementation(
        () =>
            new Promise((resolve, reject) => {
                pendingResolvers.push({ resolve, reject })
            })
    )
})

afterEach(() => {
    jest.useRealTimers()
})

async function flushPromises(): Promise<void> {
    // Drain microtasks queued by awaits / .then in the hook implementation.
    await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
    })
}

function settleAllPending(): void {
    while (pendingResolvers.length > 0) {
        const r = pendingResolvers.shift()
        r?.resolve({ ok: true })
    }
}

describe('useAutoSaveDiagram', () => {
    test('does not fire before the debounce window elapses', () => {
        const { result } = renderHook(() => useAutoSaveDiagram('p1', { delayMs: 1500 }))

        act(() => {
            result.current.scheduleSave('<bpmn>a</bpmn>')
        })
        expect(result.current.isDirty).toBe(true)

        act(() => {
            jest.advanceTimersByTime(1499)
        })
        expect(mutateAsyncMock).not.toHaveBeenCalled()
    })

    test('fires once after the debounce elapses with the latest value', async () => {
        const { result } = renderHook(() => useAutoSaveDiagram('p1', { delayMs: 1500 }))

        act(() => {
            result.current.scheduleSave('<bpmn>a</bpmn>')
        })
        act(() => {
            jest.advanceTimersByTime(500)
        })
        act(() => {
            result.current.scheduleSave('<bpmn>b</bpmn>') // resets timer
        })
        act(() => {
            jest.advanceTimersByTime(1499)
        })
        expect(mutateAsyncMock).not.toHaveBeenCalled()

        act(() => {
            jest.advanceTimersByTime(1)
        })
        await flushPromises()

        expect(mutateAsyncMock).toHaveBeenCalledTimes(1)
        expect(mutateAsyncMock).toHaveBeenCalledWith({ xml: '<bpmn>b</bpmn>' })

        // Marks saved + clears dirty after the mutation resolves.
        act(() => settleAllPending())
        await flushPromises()
        expect(result.current.isDirty).toBe(false)
        expect(result.current.lastSavedAt).not.toBeNull()
    })

    test('chains a second save when changes arrive during an in-flight save', async () => {
        const { result } = renderHook(() => useAutoSaveDiagram('p1', { delayMs: 1500 }))

        act(() => {
            result.current.scheduleSave('<bpmn>a</bpmn>')
            jest.advanceTimersByTime(1500)
        })
        await flushPromises()
        expect(mutateAsyncMock).toHaveBeenCalledTimes(1)
        expect(mutateAsyncMock).toHaveBeenLastCalledWith({ xml: '<bpmn>a</bpmn>' })

        // While the first save is in flight, schedule another change.
        act(() => {
            result.current.scheduleSave('<bpmn>b</bpmn>')
        })
        // Advance past the debounce — but the in-flight gate must still hold.
        act(() => {
            jest.advanceTimersByTime(1500)
        })
        await flushPromises()
        // No second call yet — first save hasn't resolved.
        expect(mutateAsyncMock).toHaveBeenCalledTimes(1)

        // Resolve the in-flight save; the chained save fires immediately.
        act(() => {
            const r = pendingResolvers.shift()
            r?.resolve({ ok: true })
        })
        await flushPromises()
        expect(mutateAsyncMock).toHaveBeenCalledTimes(2)
        expect(mutateAsyncMock).toHaveBeenLastCalledWith({ xml: '<bpmn>b</bpmn>' })

        // Resolve the chained one too — should settle clean.
        act(() => settleAllPending())
        await flushPromises()
        expect(result.current.isDirty).toBe(false)
    })

    test('cancel() drops a pending debounced save', async () => {
        const { result } = renderHook(() => useAutoSaveDiagram('p1', { delayMs: 1500 }))

        act(() => {
            result.current.scheduleSave('<bpmn>a</bpmn>')
        })
        act(() => {
            result.current.cancel()
            jest.advanceTimersByTime(2000)
        })
        await flushPromises()
        expect(mutateAsyncMock).not.toHaveBeenCalled()
        expect(result.current.isDirty).toBe(false)
    })

    test('flush() fires the pending save immediately', async () => {
        const { result } = renderHook(() => useAutoSaveDiagram('p1', { delayMs: 1500 }))

        act(() => {
            result.current.scheduleSave('<bpmn>x</bpmn>')
        })
        // Don't await flush — the mutation promise stays pending until the
        // test resolves it explicitly. Awaiting here would deadlock.
        let flushPromise: Promise<void> | undefined
        act(() => {
            flushPromise = result.current.flush()
        })
        await flushPromises()

        expect(mutateAsyncMock).toHaveBeenCalledTimes(1)
        expect(mutateAsyncMock).toHaveBeenCalledWith({ xml: '<bpmn>x</bpmn>' })

        act(() => settleAllPending())
        await act(async () => {
            await flushPromise
        })
        expect(result.current.isDirty).toBe(false)
    })

    test('saving the same value twice is a no-op (deduped)', async () => {
        const { result } = renderHook(() => useAutoSaveDiagram('p1', { delayMs: 1500 }))

        act(() => {
            result.current.scheduleSave('<bpmn>same</bpmn>')
            jest.advanceTimersByTime(1500)
        })
        await flushPromises()
        expect(mutateAsyncMock).toHaveBeenCalledTimes(1)
        act(() => settleAllPending())
        await flushPromises()

        act(() => {
            result.current.scheduleSave('<bpmn>same</bpmn>')
            jest.advanceTimersByTime(1500)
        })
        await flushPromises()
        // No new save — same xml as last saved.
        expect(mutateAsyncMock).toHaveBeenCalledTimes(1)
        expect(result.current.isDirty).toBe(false)
    })
})
