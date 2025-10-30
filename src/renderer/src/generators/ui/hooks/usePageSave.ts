import { useCallback } from 'react';
import { StructuredLayout } from '@renderer/lib/dnd/types';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useDispatch } from 'react-redux';
import useToast from '@renderer/hooks/useToast';
import { useGit } from '@renderer/hooks/use-git';
import { CustomFunctionConfig, Import, State, TypeDef } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';

interface PageSaveProps {
    basePath: string;
    content: { [key: string]: string }
    id: string;
    components: StructuredLayout;
    functions: CustomFunctionConfig[];
    types: TypeDef[];
    states: State[];
    imports: Import[];
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
    details?: string;
}

/**
 * Generates a descriptive commit message based on the saved content
 */
const generateCommitMessage = (
    content: { [key: string]: string },
    page: { pagePath: string; pageName: string; name: string },
    isBpmnProcess: boolean,
    isPage: boolean
): string => {
    const timestamp = Date.now();

    if (isBpmnProcess) {
        return `feat(process): update ${page.name || 'process step'} - ${timestamp}`;
    }

    if (isPage) {
        const pageName = page.pageName || page.name || 'page';
        const pagePath = page.pagePath ? ` (${page.pagePath})` : '';
        return `feat(page): update ${pageName}${pagePath} - ${timestamp}`;
    }

    if (content.scope === 'page') {
        return `feat(component): update ${content.name} in ${content.pagePath} - ${timestamp}`;
    }

    return `feat(component): update custom component ${content.name} - ${timestamp}`;
};

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
}: PageSaveProps): { handleSave: (components: StructuredLayout) => Promise<void> } => {
    const { showErrorToast, showSuccessToast } = useToast();
    const dispatch: any = useDispatch();

    const { createGitCommit } = useGit();

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

                let error: string | undefined;

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

                // Generate automatic commit message
                const commitMessage = generateCommitMessage(
                    content,
                    page,
                    isBpmnProcess,
                    isPage
                );
                createGitCommit(basePath, commitMessage);

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
            createGitCommit,
        ]
    );

    return {
        handleSave,
    };
};
