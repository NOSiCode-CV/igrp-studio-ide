import type { ProcessDefinition } from '@igrp/framework-process-studio-types'
import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import useToast from '../../../hooks/useToast'
import { useProcessStudioClient } from '../client/client-context'
import { convertActivitiToCamunda } from '../conversion/camunda-activiti'
import { bpmnQueryKeys } from './queryKeys'

/**
 * Loads a single ProcessDefinition and converts its `bpmFileContent` from the
 * server-side Activiti dialect to the Camunda dialect that the modeler
 * (`IGRPBpmnModeler`) consumes. Conversion happens **once at the boundary**
 * (see plan D3); never run it again in components.
 */
export function useProcessDefinition(
    processId: string | undefined
): UseQueryResult<ProcessDefinition> {
    const { binding } = useProcessStudioClient()
    const { showErrorToast } = useToast()

    const query = useQuery<ProcessDefinition>({
        queryKey: processId ? bpmnQueryKeys.process(processId) : bpmnQueryKeys.process('__none__'),
        queryFn: async () => {
            if (!binding) throw new Error('No active BPMN configuration')
            if (!processId) throw new Error('processId is required')
            const definition = await binding.client.processDefinitions.getById(processId)
            return {
                ...definition,
                bpmFileContent: convertActivitiToCamunda(definition.bpmFileContent ?? '')
            }
        },
        enabled: !!binding && !!processId
    })

    useEffect(() => {
        if (query.error) showErrorToast(query.error)
    }, [query.error, showErrorToast])

    return query
}
