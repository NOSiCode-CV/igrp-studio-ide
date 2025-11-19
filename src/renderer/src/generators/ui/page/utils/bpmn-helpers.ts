import { BPMNProjectProcessDefinition, BPMNProjectArtifact, FileTree } from 'src/main/types'
import { PageDefinition } from '../page-manager'

export const findProcess = (
  processDefinition: BPMNProjectProcessDefinition,
  bpmnProcesses: FileTree[]
): FileTree | undefined => {
  return bpmnProcesses.find(
    (p) =>
      p.name === processDefinition.processKey &&
      p.children?.some((c: FileTree) => c.name === `v${processDefinition.version}`)
  )
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

export const findStepProcess = (
  processDefinition: BPMNProjectProcessDefinition,
  processFound: FileTree,
  processArtifact: BPMNProjectArtifact
): FileTree | undefined => {
  const processVersionFound = processFound?.children?.find(
    (c: FileTree) => c.name === `v${processDefinition.version}`
  )

  if (!processVersionFound) return

  return processVersionFound?.children?.find(
    (c: FileTree) => c.content.taskKey === processArtifact.taskKey
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
