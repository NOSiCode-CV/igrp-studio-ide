import { useCallback } from 'react';
import { StructuredLayout } from '@renderer/lib/dnd/types';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useDispatch } from 'react-redux';
import useToast from '@renderer/hooks/useToast';

interface PageSaveProps {
    basePath: string;
    content: any;
    id: string;
    components: StructuredLayout;
    functions: any[];
    types: any[];
    states: any[];
    imports: any[];
    isPage: boolean;
    page: {
        pagePath: string;
        pageName: string;
        name: string;
    };
}

interface SaveError {
    message: string;
    code?: string;
    details?: any;
}

export const usePageSave = ({
    basePath,
    content,
    id,
    functions,
    types,
    states,
    imports,
    isPage,
    page,
}: PageSaveProps) => {
    const { showErrorToast, showSuccessToast } = useToast();
    const dispatch: any = useDispatch();

    const handleSave = useCallback(
        async (components: StructuredLayout): Promise<void> => {
            try {
                if (!basePath) {
                    throw new Error('Base path is required');
                }

                const isBpmnProcess = content.type === 'processStep';

                const config = {
                    ...content,
                    id,
                    components,
                    functions,
                    types,
                    states,
                    imports,
                };

                console.log('Saving configuration:', config);

                let error;

                if (isBpmnProcess) {
                    const result = await window.engine.createProcessStep(
                        config,
                        ENV_TYPES.NEXTJS,
                        basePath
                    );
                    error = result.error;
                } else {
                    const result = await window.engine.createPage(
                        config,
                        ENV_TYPES.NEXTJS,
                        basePath
                    );
                    error = result.error;
                }

                if (error) {
                    const saveError: SaveError = {
                        message: error,
                        code: 'SAVE_ERROR',
                    };
                    throw saveError;
                }

                showSuccessToast('Components saved successfully');
                dispatch(onSetChangeStatus(true));
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred';
                showErrorToast(errorMessage);
                console.error('Save error:', error);
            }
        },
        [
            basePath,
            content,
            id,
            functions,
            types,
            states,
            imports,
            isPage,
            showSuccessToast,
            showErrorToast,
            dispatch,
            page,
        ]
    );

    return {
        handleSave,
    };
};
