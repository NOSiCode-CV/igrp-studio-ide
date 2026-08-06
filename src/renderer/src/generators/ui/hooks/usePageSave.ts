import type {
    CustomFunctionConfig,
    Import,
    State,
    TypeDef
} from '@igrp/igrp-studio-nextjs-engine/types'
import { ENV_TYPES } from '@renderer/constants/appConstants'
import { useGit } from '@renderer/hooks/use-git'
import useToast from '@renderer/hooks/useToast'
import type { StructuredLayout } from '@renderer/lib/dnd/types'
import { sanitizeLayoutRules } from '@renderer/generators/ui/utils/permissionRules'
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

interface PageSaveProps {
    basePath: string
    /** Payload for save: id, components, functions, types, states, imports, args, etc. */
    restData: {
        id?: string
        components?: StructuredLayout
        functions?: CustomFunctionConfig[]
        types?: TypeDef[]
        states?: State[]
        imports?: Import[]
        [key: string]: unknown
    }
    isPage: boolean
    page: {
        pagePath: string
        pageName: string
        name: string
    }
}

interface SaveError {
    message: unknown
    code?: string
    details?: unknown
}

const getSaveErrorMessage = (error: unknown): string | undefined => {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error

    if (Array.isArray(error)) {
        const messages = error
            .map(getSaveErrorMessage)
            .filter((message): message is string => Boolean(message))

        return messages.join('\n\n') || undefined
    }

    if (typeof error === 'object' && error !== null) {
        const { details, error: nestedError, message } = error as Record<string, unknown>

        if (typeof message === 'string') return message
        if (message !== undefined) return getSaveErrorMessage(message)
        if (typeof details === 'string') return details
        if (nestedError !== undefined) return getSaveErrorMessage(nestedError)
    }

    return undefined
}

/**
 * Generates a descriptive commit message based on the saved content
 */
const generateCommitMessage = (
    restData: any,
    page: { pagePath: string; pageName: string; name: string },
    isBpmnProcess: boolean,
    isPage: boolean
): string => {
    const timestamp = Date.now()

    if (isBpmnProcess) {
        return `feat(process): update ${page.name || 'process step'} - ${timestamp}`
    }

    if (isPage) {
        const pageName = page.pageName || page.name || 'page'
        const pagePath = page.pagePath ? ` (${page.pagePath})` : ''
        return `feat(page): update ${pageName}${pagePath} - ${timestamp}`
    }

    if (restData.scope === 'page') {
        return `feat(component): update ${restData.name} in ${restData.pagePath} - ${timestamp}`
    }

    return `feat(component): update custom component ${restData.name} - ${timestamp}`
}

export const usePageSave = ({
    basePath,
    restData,
    isPage,
    page
}: PageSaveProps): {
    handleSave: () => Promise<void>
} => {
    const { showErrorToast, showSuccessToast } = useToast()
    const dispatch: any = useDispatch()

    const { createGitCommit } = useGit()

    const handleSave = useCallback(async (): Promise<void> => {
        try {
            if (!basePath) {
                throw new Error('Base path is required')
            }

            const isBpmnProcess = restData.type === 'processStep'

            const components = restData.components
                ? sanitizeLayoutRules(restData.components as StructuredLayout)
                : restData.components

            const payload = {
                ...restData,
                components
            }

            console.log('Saving configuration:', payload)

            let error: unknown

            if (isBpmnProcess) {
                const result = await window.engine.createProcessStep(
                    payload,
                    ENV_TYPES.NEXTJS,
                    basePath
                )
                error = result.error
            } else {
                const result = await window.engine.createPage(payload, ENV_TYPES.NEXTJS, basePath)
                error = result.error
            }

            if (error) {
                const saveError: SaveError = {
                    message: error,
                    code: 'SAVE_ERROR'
                }
                throw saveError
            }

            // Generate automatic commit message
            const commitMessage = generateCommitMessage(restData, page, isBpmnProcess, isPage)
            createGitCommit(basePath, commitMessage)

            showSuccessToast('Components saved successfully')
            dispatch(onSetChangeStatus(true))
        } catch (error) {
            const errorMessage = getSaveErrorMessage(error) || 'Unknown error occurred'
            showErrorToast(errorMessage)
            console.error('Save error:', error)
        }
    }, [basePath, restData, isPage, page, restData, createGitCommit])

    return {
        handleSave
    }
}
