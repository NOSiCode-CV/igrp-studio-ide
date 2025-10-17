import {
    setConfigAction,
    setBasePathAction,
    setChangeStatusAction,
    setCurrentItemAction,
    setFilesThreeAction,
    setWorkspaceAction,
} from './reducer';
import { FileTree, IWorkspace, ProjectData } from 'src/main/types';
/**
 * set BasePath
 * @param {*} param0
 */
export const setBasePath = (basePath: string) => async (dispatch: any) => {
    try {
        dispatch(setBasePathAction(basePath));
    } catch (error) {}
};

/**
 * set BasePath
 * @param {*} param0
 */
export const setConfig = (appConfig: ProjectData) => async (dispatch: any) => {
    try {
        dispatch(setConfigAction(appConfig));
    } catch (error) {}
};

/**
 * set status
 * @param {*} param0
 */
export const setChangeStatus = (status: boolean) => async (dispatch: any) => {
    try {
        dispatch(setChangeStatusAction(status));
    } catch (error) {}
};

/**
 * set status
 * @param {*} param0
 */
export const setCurrentItem = (item: any) => async (dispatch: any) => {
    try {
        dispatch(setCurrentItemAction(item));
    } catch (error) {}
};

/**
 * set status
 * @param {*} param0
 */
export const setWorkspace =
    (workspace: IWorkspace | null) => async (dispatch: any) => {
        try {
            dispatch(setWorkspaceAction(workspace));
        } catch (error) {}
    };

/* /**
 *  fetch  pages
 * @param {*} param0
 */

export const getFileThree = (basePath: string) => async (dispatch: any) => {
    try {
        let filesThree: FileTree[] = await window.api.fetchFiles(
            `${basePath}/.igrpstudio`
        );
        dispatch(setFilesThreeAction(filesThree));
    } catch (error) {
        console.error('error:', error);
    }
};
