import { useEffect, useRef } from 'react';

export const useDebug = (componentName: string, dependencies: any[] = []) => {
    const renderCount = useRef(0);

    useEffect(() => {
        renderCount.current += 1;
        console.log(
            `[Debug] ${componentName} rendered ${renderCount.current} times`,
            {
                dependencies,
                timestamp: new Date().toISOString(),
            }
        );
    }, dependencies);

    useEffect(() => {
        console.log(`[Debug] ${componentName} mounted`);

        return () => {
            console.log(`[Debug] ${componentName} unmounted`);
        };
    }, [componentName]);
};
