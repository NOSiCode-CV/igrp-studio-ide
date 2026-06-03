/**
 * TanStack Query keys for the BPMN module. Centralised so consumers (and
 * tests) can target invalidations precisely. See process-integration plan §4.5.
 */
export const bpmnQueryKeys = {
    all: ['bpmn'] as const,
    projects: () => [...bpmnQueryKeys.all, 'projects'] as const,
    project: (projectId: string) => [...bpmnQueryKeys.all, 'project', projectId] as const,
    process: (processId: string) => [...bpmnQueryKeys.all, 'process', processId] as const
}
