import type { Layout, RuleDefinition } from '@igrp/igrp-studio-nextjs-engine/types'
import { ENV_TYPES } from '@renderer/constants/appConstants'
import { isPermissionRule } from '@renderer/generators/ui/utils/permissionRules'
import type { FileTree } from 'src/main/types'

export interface PermissionUsageFile {
    path: string
    label: string
}

export interface PermissionUsageInfo {
    count: number
    sources: string[]
    files: PermissionUsageFile[]
}

type LayoutNode = {
    componentName?: string
    rules?: RuleDefinition[]
    children?: LayoutNode[]
}

function collectJsonLeaves(nodes: FileTree[] | undefined): FileTree[] {
    if (!nodes?.length) return []
    const out: FileTree[] = []
    for (const node of nodes) {
        if (node.isDirectory) {
            out.push(...collectJsonLeaves(node.children))
        } else if (node.name.endsWith('.json')) {
            out.push(node)
        }
    }
    return out
}

function layoutSourceLabel(file: FileTree, folder: string): string {
    const content = file.content
    if (content?.pageName) return `${folder}/${content.pageName}`
    if (content?.name) return `${folder}/${content.name}`
    return `${folder}/${file.name.replace(/\.json$/i, '')}`
}

function walkLayoutKeys(node: LayoutNode | undefined, visit: (key: string) => void): void {
    if (!node) return

    for (const rule of node.rules ?? []) {
        if (!isPermissionRule(rule)) continue
        for (const key of rule.permission ?? []) {
            const trimmed = typeof key === 'string' ? key.trim() : ''
            if (trimmed) visit(trimmed)
        }
        if (rule.fallback) walkLayoutKeys(rule.fallback as LayoutNode, visit)
    }

    for (const child of node.children ?? []) {
        walkLayoutKeys(child, visit)
    }
}

function artifactFolders(tree: FileTree[]): Array<{ folder: string; nodes: FileTree[] }> {
    const pages = tree.find((n) => n.name === 'pages')?.children ?? []
    const components = tree.find((n) => n.name === 'components')?.children ?? []
    const process = tree.find((n) => n.name === 'process')?.children ?? []
    return [
        { folder: 'pages', nodes: pages },
        { folder: 'components', nodes: components },
        { folder: 'process', nodes: process }
    ]
}

/** Scan `.igrpstudio` pages/components/process for permission key references. */
export async function computePermissionUsage(
    basePath: string
): Promise<Map<string, PermissionUsageInfo>> {
    const usage = new Map<string, PermissionUsageInfo>()

    if (!basePath || !window.api?.fetchFiles) return usage

    const tree = (await window.api.fetchFiles(`${basePath}/.igrpstudio`)) as FileTree[]
    if (!Array.isArray(tree)) return usage

    for (const { folder, nodes } of artifactFolders(tree)) {
        for (const file of collectJsonLeaves(nodes)) {
            const layout = file.content?.components as LayoutNode | undefined
            if (!layout) continue

            const label = layoutSourceLabel(file, folder)
            const keysInFile = new Set<string>()

            walkLayoutKeys(layout, (key) => {
                keysInFile.add(key)
                const current = usage.get(key) ?? { count: 0, sources: [], files: [] }
                current.count += 1
                usage.set(key, current)
            })

            for (const key of keysInFile) {
                const current = usage.get(key)!
                if (!current.sources.includes(label)) current.sources.push(label)
                if (!current.files.some((f) => f.path === file.path)) {
                    current.files.push({ path: file.path, label })
                }
            }
        }
    }

    return usage
}

/** Remove a permission key from all rules in a layout tree. Drops empty permission rules. */
export function removePermissionKeyFromLayout<T extends LayoutNode>(node: T, key: string): T {
    const trimmed = key.trim()

    const nextRules = node.rules
        ?.map((rule) => {
            if (!isPermissionRule(rule)) return rule
            const permission = (rule.permission ?? []).filter((p) => p.trim() !== trimmed)
            if (permission.length === 0) return null
            const next = { ...rule, permission }
            if (next.fallback) {
                next.fallback = removePermissionKeyFromLayout(
                    next.fallback as Layout,
                    trimmed
                ) as Layout
            }
            return next
        })
        .filter((rule): rule is RuleDefinition => rule != null)

    const children = node.children?.map((child) => removePermissionKeyFromLayout(child, trimmed))

    const next = { ...node } as T
    if (nextRules?.length) next.rules = nextRules
    else delete (next as { rules?: RuleDefinition[] }).rules
    if (children) next.children = children
    return next
}

/** Rename a permission key inside a layout tree (keeps rule if other keys remain). */
export function renamePermissionKeyInLayout<T extends LayoutNode>(
    node: T,
    fromKey: string,
    toKey: string
): T {
    const from = fromKey.trim()
    const to = toKey.trim()
    if (!from || !to || from === to) return node

    const nextRules = node.rules?.map((rule) => {
        if (!isPermissionRule(rule)) return rule
        const permission = (rule.permission ?? []).map((p) => (p.trim() === from ? to : p))
        // Deduplicate if both old and new already present
        const unique = [...new Set(permission.map((p) => p.trim()).filter(Boolean))]
        const next = { ...rule, permission: unique }
        if (next.fallback) {
            next.fallback = renamePermissionKeyInLayout(
                next.fallback as Layout,
                from,
                to
            ) as Layout
        }
        return next
    })

    const children = node.children?.map((child) =>
        renamePermissionKeyInLayout(child, from, to)
    )

    const next = { ...node } as T
    if (nextRules) next.rules = nextRules
    if (children) next.children = children
    return next
}

function layoutReferencesKey(node: LayoutNode | undefined, key: string): boolean {
    if (!node) return false
    let found = false
    walkLayoutKeys(node, (k) => {
        if (k === key) found = true
    })
    return found
}

async function patchLayoutsInProject(
    basePath: string,
    key: string,
    transform: (layout: LayoutNode) => LayoutNode
): Promise<string[]> {
    if (!basePath || !window.api?.fetchFiles) return []

    const tree = (await window.api.fetchFiles(`${basePath}/.igrpstudio`)) as FileTree[]
    if (!Array.isArray(tree)) return []

    const updated: string[] = []
    const trimmed = key.trim()

    for (const { folder, nodes } of artifactFolders(tree)) {
        for (const file of collectJsonLeaves(nodes)) {
            const content = file.content
            const layout = content?.components as LayoutNode | undefined
            if (!layout || !layoutReferencesKey(layout, trimmed)) continue

            const nextLayout = transform(layout)
            const payload = { ...content, components: nextLayout }
            const isProcessStep = content?.type === 'processStep'

            const result = isProcessStep
                ? await window.engine.createProcessStep(payload, ENV_TYPES.NEXTJS, basePath)
                : await window.engine.createPage(payload, ENV_TYPES.NEXTJS, basePath)

            if (result?.error) {
                throw new Error(
                    typeof result.error === 'string'
                        ? result.error
                        : `Failed to update ${layoutSourceLabel(file, folder)}`
                )
            }

            updated.push(layoutSourceLabel(file, folder))
        }
    }

    return updated
}

/**
 * Strip `key` from every page/component/process layout that references it,
 * then persist via createPage / createProcessStep.
 */
export async function removePermissionKeyFromProject(
    basePath: string,
    key: string
): Promise<string[]> {
    return patchLayoutsInProject(basePath, key, (layout) =>
        removePermissionKeyFromLayout(layout, key)
    )
}

/**
 * Rename `fromKey` → `toKey` in every layout that references the old key.
 */
export async function renamePermissionKeyInProject(
    basePath: string,
    fromKey: string,
    toKey: string
): Promise<string[]> {
    return patchLayoutsInProject(basePath, fromKey, (layout) =>
        renamePermissionKeyInLayout(layout, fromKey, toKey)
    )
}
