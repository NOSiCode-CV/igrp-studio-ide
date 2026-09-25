import type { StructuredLayout } from '@renderer/lib/dnd/types'

export function sanitizeLeafButtonAsChild(node: StructuredLayout): StructuredLayout {
    const children = node.children.map(sanitizeLeafButtonAsChild)

    if (node.componentName !== 'button' || children.length > 0) {
        return { ...node, children }
    }

    const { asChild: _asChild, ...properties } = node.properties
    const { asChild: _dataAsChild, ...data } = node.data ?? {}

    return {
        ...node,
        children,
        properties,
        data: node.data ? data : undefined
    }
}
