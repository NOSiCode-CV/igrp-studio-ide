import type { ProcessDefinition } from '@igrp/framework-process-studio-types'
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query'
import useToast from '../../../hooks/useToast'
import { useProcessStudioClient } from '../client/client-context'
import { convertCamundaToActiviti } from '../conversion/camunda-activiti'
import { bpmnQueryKeys } from './queryKeys'

export interface SaveDiagramVariables {
    /** Camunda XML produced by the modeler. The hook converts to Activiti before sending. */
    xml: string
}

export interface SaveDiagramContext {
    previous?: ProcessDefinition
}

/**
 * Saves the diagram for a single process. Accepts **Camunda** XML; converts to
 * Activiti exactly once at the boundary (plan D3). On success, the cached
 * detail entry is updated optimistically and the project list query is
 * invalidated so any "last updated" indicators refresh.
 */
export function useSaveProcessDiagram(
    processId: string | undefined
): UseMutationResult<Response, Error, SaveDiagramVariables, SaveDiagramContext> {
    const { binding } = useProcessStudioClient()
    const queryClient = useQueryClient()
    const { showErrorToast } = useToast()

    return useMutation<Response, Error, SaveDiagramVariables, SaveDiagramContext>({
        mutationFn: async ({ xml }) => {
            if (!binding) throw new Error('No active BPMN configuration')
            if (!processId) throw new Error('processId is required')
            const activitiXml = convertCamundaToActiviti(xml)
            return binding.client.processDefinitions.saveDiagram(processId, {
                content: activitiXml
            })
        },
        onMutate: async ({ xml }) => {
            if (!processId) return {}
            const key = bpmnQueryKeys.process(processId)
            await queryClient.cancelQueries({ queryKey: key })
            const previous = queryClient.getQueryData<ProcessDefinition>(key)
            if (previous) {
                queryClient.setQueryData<ProcessDefinition>(key, {
                    ...previous,
                    bpmFileContent: xml
                })
            }
            return { previous }
        },
        onError: (error, _vars, context) => {
            if (processId && context?.previous) {
                queryClient.setQueryData(bpmnQueryKeys.process(processId), context.previous)
            }
            showErrorToast(error)
        },
        onSettled: () => {
            if (processId) {
                queryClient.invalidateQueries({ queryKey: bpmnQueryKeys.process(processId) })
            }
            queryClient.invalidateQueries({ queryKey: bpmnQueryKeys.all })
        }
    })
}
