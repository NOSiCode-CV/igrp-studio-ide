import { ROUTES } from '@renderer/routes/routeConstants';

import {
  setConfigAction,
  setBasePathAction,
  setChangeStatusAction,
  setCurrentItemAction,
  setFilesThreeAction,
  setWorkspaceAction
} from './reducer';
import { FileTree, IWorkspace, ProjectData } from 'src/main/types';
import { ENV_TYPES } from '@renderer/constants/appConstants';
/**
 * set BasePath
 * @param {*} param0
 */
export const setBasePath = (basePath: string) => async (dispatch: any) => {
  try {
    dispatch(setBasePathAction(basePath));
  } catch (error) { }
};

/**
 * set BasePath
 * @param {*} param0
 */
export const setConfig = (appConfig: ProjectData) => async (dispatch: any) => {
  try {
    dispatch(setConfigAction(appConfig));
  } catch (error) { }
};

/**
 * set status
 * @param {*} param0
 */
export const setChangeStatus = (status: boolean) => async (dispatch: any) => {
  try {
    dispatch(setChangeStatusAction(status));
  } catch (error) { }
};

/**
 * set status
 * @param {*} param0
 */
export const setCurrentItem = (item: any) => async (dispatch: any) => {
  try {
    dispatch(setCurrentItemAction(item));
  } catch (error) { }
};

/**
 * set status
 * @param {*} param0
 */
export const setWorkspace = (workspace: IWorkspace | null) => async (dispatch: any) => {
  try {
    dispatch(setWorkspaceAction(workspace));
  } catch (error) { }
};


/**
 * set BasePath
 * @param {*} param0
 */
export const navigateToNextPage = async (navigate, appConfig: ProjectData) => {
  try {
    if (appConfig.framework === ENV_TYPES.NEXTJS) {
      await window.engine.registry(ENV_TYPES.NEXTJS, appConfig.path)
      navigate(ROUTES.PATH_PAGE_BUILDER_UI);
    } else if (appConfig.framework === ENV_TYPES.SPRING) {
      navigate(ROUTES.PATH_PAGE_BUILDER_API);
    }
  } catch (error) {
    console.error('Navigation error:', error);
  }
};

/* /**
*  fetch  pages
* @param {*} param0
*/

export const getFileThree = (basePath: string) => async (dispatch: any) => {
  try {
    let filesThree: FileTree[] = await window.api.fetchFiles(`${basePath}/.igrpstudio`)
    dispatch(setFilesThreeAction(filesThree));
  } catch (error) {
    console.error('error:', error);
  }
};
