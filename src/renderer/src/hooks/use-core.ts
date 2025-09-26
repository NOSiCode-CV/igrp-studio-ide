import { useCallback } from 'react';
import { HandlerResponse } from 'src/main/types';

const useCore = () => {
    const getVersions = useCallback(async () => {
        const { result }: HandlerResponse = await window.api.getVersions(
            import.meta.env.RENDERER_VITE_API_IGRP_VERSIONS
        );

        return result.items.map((item: any) => {
            return {
                label: item.version,
                value: item.version,
            };
        });
    }, []);

    const fetchData = useCallback(async (endpoint: string, headers: object) => {
        const result: HandlerResponse = await window.api.fetchData(
            endpoint,
            headers
        );

        return result;
    }, []);

    return {
        getVersions,
        fetchData,
    };
};

export default useCore;
