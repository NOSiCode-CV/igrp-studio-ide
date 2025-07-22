import { useState, useEffect, useCallback } from 'react';
import { BPMNPageDefinition } from 'src/main/types';
import { bpmnService } from '@renderer/services/bpmn-service';
import { toast } from 'sonner';

export const useBPMNPages = () => {
    const [pageDefinitions, setPageDefinitions] = useState<BPMNPageDefinition[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPageDefinitions = useCallback(async () => {
        try {
            setLoading(true);
            const pages = await bpmnService.getPageDefinitions();
            setPageDefinitions(pages);
        } catch (error) {
            toast.error('Failed to load BPMN page definitions');
        } finally {
            setLoading(false);
        }
    }, []);

    const savePageDefinition = useCallback(async (pageDefinition: BPMNPageDefinition) => {
        try {
            await bpmnService.savePageDefinition(pageDefinition);
            await loadPageDefinitions();
            toast.success('BPMN page saved successfully');
        } catch (error) {
            toast.error('Failed to save BPMN page');
        }
    }, [loadPageDefinitions]);

    const deletePageDefinition = useCallback(async (pageDefinitionId: string) => {
        try {
            await bpmnService.deletePageDefinition(pageDefinitionId);
            await loadPageDefinitions();
            toast.success('BPMN page deleted successfully');
        } catch (error) {
            toast.error('Failed to delete BPMN page');
        }
    }, [loadPageDefinitions]);

    const getPageDefinitionsByProcess = useCallback(async (processDefinitionId: string) => {
        try {
            const pages = await bpmnService.getPageDefinitionsByProcess(processDefinitionId);
            return pages;
        } catch (error) {
            toast.error('Failed to load process pages');
            return [];
        }
    }, []);

    useEffect(() => {
        loadPageDefinitions();
    }, [loadPageDefinitions]);

    return {
        pageDefinitions,
        loading,
        loadPageDefinitions,
        savePageDefinition,
        deletePageDefinition,
        getPageDefinitionsByProcess,
    };
}; 