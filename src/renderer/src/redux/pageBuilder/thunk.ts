import { ROUTES } from '@renderer/routes/routeConstants';

import {
  setConfigAction,
  setBasePathAction,
  setFilesThreeAction,
  setChangeStatusAction,
  setCurrentItemAction
} from './reducer';
import useToast from '@renderer/components/useToast';
import { ProjectData, FileTree } from 'src/main/types';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import { DeleteConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
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
 * set BasePath
 * @param {*} param0
 */
export const navigateToNextPage = async (navigate, appConfig: ProjectData) => {
  try {
    if (appConfig.framework === ENV_TYPES.NEXTJS) {
      await window.engine.registryComponent(ENV_TYPES.NEXTJS, appConfig.path)
      navigate(ROUTES.PATH_PAGE_BUILDER_UI);
    } else if (appConfig.framework === ENV_TYPES.SPRING) {
      navigate(ROUTES.PATH_PAGE_BUILDER_API);
    }
  } catch (error) {
    console.error('Navigation error:', error);
  }
};

/**
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

/**
*  delete  page file
* @param {*} param0
*/
export const deletePage = (pageConfig: DeleteConfig, basePath: string) => async () => {
  const { showErrorToast, showSuccessToast } = useToast();
  try {
    const { error } = await window.engine.delete(pageConfig, ENV_TYPES.NEXTJS, basePath)

    if (error) {
      showErrorToast(error);
      return;
    }

    showSuccessToast('Page removed successfully');

  } catch (error) {
    showErrorToast(error);
  }
};