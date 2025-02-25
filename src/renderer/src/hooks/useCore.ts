import { useCallback } from "react";
import { HandlerResponse } from "src/main/types";

const useCore = () => {
    const getVersions = useCallback(async () => {
        const data: HandlerResponse = await window.api.getVersions(import.meta.env.RENDERER_VITE_API_IGRP_VERSIONS);

        console.log(data)
    
        const sortedVersions = data.result.sort((a, b) => {
            const [_, dateA, suffixA] = a.match(/-(\d{8}\.\d{6})-(\d+)$/);
            const [__, dateB, suffixB] = b.match(/-(\d{8}\.\d{6})-(\d+)$/);

            if (dateA > dateB) return -1;
            if (dateA < dateB) return 1;

            return parseInt(suffixB) - parseInt(suffixA);
        });

        return sortedVersions.map((value) => {
            return {
                label: value,
                value: value,
            };
        });
    }, []);

    return {
        getVersions,
    };
};

export default useCore;