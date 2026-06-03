import type { ProcessDefinition, Project } from '@igrp/framework-process-studio-types'
import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import useToast from '../../../hooks/useToast'
import { useEffect } from 'react'
import { useProcessStudioClient } from '../client/client-context'
import { bpmnQueryKeys } from './queryKeys'

export function useProjects(): UseQueryResult<Project[]> {
    const { binding } = useProcessStudioClient()
    const { showErrorToast } = useToast()

    const query = useQuery<Project[]>({
        queryKey: bpmnQueryKeys.projects(),
        queryFn: async () => {
            if (!binding) throw new Error('No active BPMN configuration')
            const response = await binding.client.projects.getAll()
            return response.content ?? []
        },
        enabled: !!binding
    })

    useEffect(() => {
        if (query.error) showErrorToast(query.error)
    }, [query.error, showErrorToast])

    return query
}

export function useProcessDefinitions(
    projectId: string | undefined
): UseQueryResult<ProcessDefinition[]> {
    const { binding } = useProcessStudioClient()
    const { showErrorToast } = useToast()

    const query = useQuery<ProcessDefinition[]>({
        queryKey: projectId ? bpmnQueryKeys.project(projectId) : bpmnQueryKeys.project('__none__'),
        queryFn: async () => {
            if (!binding) throw new Error('No active BPMN configuration')
            if (!projectId) return []
            const project = await binding.client.projects.getById(projectId)
            return project.processDefinitions ?? []
        },
        enabled: !!binding && !!projectId
    })

    useEffect(() => {
        if (query.error) showErrorToast(query.error)
    }, [query.error, showErrorToast])

    return query
}
