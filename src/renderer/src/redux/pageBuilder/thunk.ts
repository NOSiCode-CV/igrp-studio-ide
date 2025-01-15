import { ROUTES } from '@renderer/routes/routeConstants';

import {
  setConfigAction,
  setBasePathAction,
  setFolderFilesAction,
  setChangeStatusAction,
  setCurrentItemAction
} from './reducer';
import { PageConfig } from '@igrp/nextjs-engine/dist/interfaces/types';
import useToast from '@renderer/components/useToast';
import { ProjectData, FolderFiles } from 'src/main/types';
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
 * set BasePath
 * @param {*} param0
 */
export const navigateToNextPage = (navigate, appConfig: ProjectData) => {
  try {
    if (appConfig.framework === ENV_TYPES.NEXTJS) {
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
export const getPages = (basePath: string) => async (dispatch: any) => {
  try {
    let folderFiles: FolderFiles = await window.api.fetchFiles(basePath)
    dispatch(setFolderFilesAction(folderFiles));
  } catch (error) {
    console.error('error:', error);
  }
};

/**
*  delete  page file
* @param {*} param0
*/
export const deletePage = (pageConfig: PageConfig, basePath: string) => async () => {
  const { showErrorToast, showSuccessToast } = useToast();
  try {
    const { error } = await window.api.deletePage(pageConfig, basePath)

    if (error) {
      showErrorToast(error);
    }

    showSuccessToast('Page removed successfully');

  } catch (error) {
    showErrorToast(error);
  }
};