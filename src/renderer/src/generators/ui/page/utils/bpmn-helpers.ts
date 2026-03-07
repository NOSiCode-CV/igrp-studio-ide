import type { BPMNProjectArtifact, BPMNProjectProcessDefinition, FileTree } from 'src/main/types'
import type { PageDefinition } from '../page-manager'
import { getKeyFromFormKey } from './form-key-utils'

/** Matches version folder names: v1, v2, v9, etc. */
const VERSION_FOLDER_PATTERN = /^v\d+$/

/**
 * Returns items whose name is NOT a version folder (v + number).
 * Use to get files/siblings and exclude v1, v2, v9, etc.
 */
export const getNonVersionFolderItems = <T extends { name?: string }>(
    items: T[] | undefined
): T[] => (items ?? []).filter((item) => !VERSION_FOLDER_PATTERN.test(item.name ?? ''))

/**
 * Returns the process config file from children (name does not match v + number).
 * Excludes version folders (v1, v2, v3...) and returns the file with content.type === 'process'.
 */
export const getProcessConfigFile = (children: FileTree[] | undefined): FileTree | undefined => {
    const nonVersion = getNonVersionFolderItems(children)
    return nonVersion.find((c) => c.content?.type === 'process')
}

export const findProcess = (
    processDefinition: BPMNProjectProcessDefinition,
    bpmnProcesses: FileTree[]
): FileTree | undefined => {
    const process = bpmnProcesses.find((p) => p.name === processDefinition.processKey)

    const versionFolders = (process?.children ?? []).filter(
        (c) => c.name === `${processDefinition.processKey}.json` && c.content?.type === 'process'
    )

    return versionFolders && versionFolders.length > 0 ? versionFolders[0] : undefined
}

export const findProcessRecursive = (
    processDefinition: BPMNProjectProcessDefinition,
    bpmnProcesses: FileTree[]
): FileTree | undefined => {
    // Find the process by name
    const process = bpmnProcesses.find((p) => p.name === processDefinition.processKey)
    if (!process || !process.children) {
        return undefined
    }

    // Start from the current version and go backwards to find the first available version
    let currentVersion = processDefinition.version || 1

    while (currentVersion >= 1) {
        const versionName = `v${currentVersion}`
        const versionFound = process.children.find((c: FileTree) => c.name === versionName)

        if (versionFound) {
            return process
        }

        currentVersion--
    }

    // If no version found, return the process anyway (for first-time creation)
    return process
}

/**
 * Finds the process step file (matching taskKey) inside the process.
 * Steps live inside version folders (v1, v2, v3...); we search in the latest version first.
 */
export const findStepProcess = (
    bpmnProcesses: FileTree[],
    processArtifact: BPMNProjectArtifact,
    processDefinition: BPMNProjectProcessDefinition
): FileTree | undefined => {
    const key = getKeyFromFormKey(processArtifact.formKey)

    const process = bpmnProcesses.find((p) => p.name === processDefinition.processKey)

    const versionFolders = (process?.children ?? []).filter(
        (c) => c.name === `${key}.json` && c.content?.type === 'processStep'
    )

    return versionFolders && versionFolders.length > 0 ? versionFolders[0] : undefined
}

export const convertFileTreeToPageDefinition = (fileTree: FileTree): PageDefinition => {
    return {
        ...fileTree,
        ...fileTree.content,
        id: fileTree.content?.id || '',
        type: fileTree.content?.type || 'component',
        name: fileTree.content?.name || '',
        description: fileTree.content?.description || '',
        path: fileTree.content?.path || fileTree.path,
        pagePath: fileTree.content?.path || fileTree.path,
        status: 'active',
        created: new Date().toISOString(),
        pageName: fileTree.content?.name || fileTree.name,
        isPage: false,
        content: fileTree.content || {}
    } as PageDefinition
}
