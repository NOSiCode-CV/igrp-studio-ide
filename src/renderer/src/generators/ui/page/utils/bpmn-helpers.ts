import { BPMNProjectProcessDefinition, BPMNProjectArtifact, FileTree } from 'src/main/types'
import { PageDefinition } from '../page-manager'

/** Matches version folder names: v1, v2, v9, etc. */
const VERSION_FOLDER_PATTERN = /^v\d+$/

/**
 * Returns items whose name is NOT a version folder (v + number).
 * Use to get files/siblings and exclude v1, v2, v9, etc.
 */
export const getNonVersionFolderItems = <T extends { name?: string }>(items: T[] | undefined): T[] =>
  (items ?? []).filter((item) => !VERSION_FOLDER_PATTERN.test(item.name ?? ''))

export const findProcess = (
  processDefinition: BPMNProjectProcessDefinition,
  bpmnProcesses: FileTree[]
): FileTree | undefined =>
  bpmnProcesses.find((p) => p.name === processDefinition.processKey)

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

export const findStepProcess = (
  processFound: FileTree,
  processArtifact: BPMNProjectArtifact
): FileTree | undefined => {
  return processFound?.children?.find(
    (c: FileTree) => c.content?.taskKey === processArtifact?.taskKey
  )
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
