import { useState, useEffect } from 'react'
import { BPMNProject, BPMNProjectProcessDefinition } from 'src/main/types'
import { bpmnService } from '@renderer/services/bpmn-service'
import { useIGRPToast } from '@igrp/igrp-framework-react-design-system'

export const useBPMNProjects = (refreshTrigger?: number) => {
  const [projects, setProjects] = useState<BPMNProject[]>([])
  const [loading, setLoading] = useState(true)
  const { igrpToast } = useIGRPToast()

  const loadProjects = async (): Promise<void> => {
    try {
      setLoading(true)
      const projectsData = await bpmnService.getProjects()
      setProjects(projectsData)
    } catch (error) {
      igrpToast({ type: 'error', content: 'Failed to load projects' })
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [refreshTrigger])

  return { projects, loading, loadProjects }
}

export const useProcessDefinitions = (selectedProject: BPMNProject | null) => {
  const [processDefinitions, setProcessDefinitions] = useState<BPMNProjectProcessDefinition[]>([])
  const [loading, setLoading] = useState(false)
  const { igrpToast } = useIGRPToast()

  const loadProcessDefinitions = async (projectId: string): Promise<void> => {
    try {
      setLoading(true)
      const processes = await bpmnService.getProcessDefinitionsByProject(projectId)
      setProcessDefinitions(processes)
    } catch (error) {
      setProcessDefinitions([])
      igrpToast({ type: 'error', content: 'Failed to load process definitions' })
      console.error('Error loading process definitions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedProject) {
      loadProcessDefinitions(selectedProject.projectId)
    } else {
      setProcessDefinitions([])
    }
  }, [selectedProject])

  return { processDefinitions, loading, loadProcessDefinitions }
}
