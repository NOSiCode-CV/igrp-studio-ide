import { StructuredComponent } from '@renderer/lib/dnd/types'
import { useRef, useCallback } from 'react'

export function useTagManager(componentTree: StructuredComponent | null) {
  const tagSetRef = useRef<Set<string>>(new Set())

  // Função recursiva para coletar todos os TAGs
  const collectAllIds = useCallback((component: StructuredComponent): string[] => {
    const tags = [component.tag]
    component.children?.forEach((child) => {
      tags.push(...collectAllIds(child))
    })
    return tags
  }, [])

  // Reconstrói o Set de IDs com base no componente atual
  const rebuild = useCallback(() => {
    if (!componentTree) return
    const newSet = new Set<string>()
    collectAllIds(componentTree).forEach((tag) => newSet.add(tag))
    tagSetRef.current = newSet
  }, [componentTree, collectAllIds])

  // Gera um ID único baseado em um prefixo/base
  const generateTag = useCallback((base: string): string => {
    let index = 1
    let candidate = `${base}${index}`
    while (tagSetRef.current.has(candidate)) {
      index++
      candidate = `${base}${index}`
    }
    tagSetRef.current.add(candidate) // Reservar o ID
    return candidate
  }, [])

  // Verifica se um ID está em uso
  const isUsed = useCallback((id: string): boolean => {
    return tagSetRef.current.has(id)
  }, [])

  return {
    rebuild,
    generateTag,
    isUsed,
    existingTags: tagSetRef.current
  }
}
