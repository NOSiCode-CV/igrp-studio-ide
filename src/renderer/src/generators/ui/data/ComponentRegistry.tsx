import { UiButton, UiDate, UiText } from '../types/fields';
import { APP_COMPONENT, COLUMN, COMPONENTS, FIELDS } from '../ComponentTypes';
import { lazy } from 'react';

const PageHeaderLayout = lazy(() => import('../types/containers/pageHeader'));
const FormLayout = lazy(() => import('../types/containers/form'));
const AppCompLayout = lazy(() => import('../types/containers/app'));

export const ComponentRegistry: { [key: string]: React.FC<any> } = {
    [COMPONENTS.FORM]: FormLayout,
    [COMPONENTS.PAGE_HEADER]: PageHeaderLayout,
    [APP_COMPONENT]: AppCompLayout,
    [FIELDS.TEXT]: UiText,
    [FIELDS.DATE]: UiDate,
    [FIELDS.BUTTON]: UiButton,
};

export const AcceptTypesRegistry: { [key: string]: string[] } = {
    [COMPONENTS.FORM]: [FIELDS.DATE, FIELDS.TEXT, FIELDS.BUTTON],
    [COMPONENTS.TABLE]: [FIELDS.DATE, FIELDS.TEXT, FIELDS.BUTTON],
    [COLUMN]: [COMPONENTS.FORM, COMPONENTS.PAGE_HEADER, APP_COMPONENT],
    [COMPONENTS.PAGE_HEADER]: [FIELDS.BUTTON],
};
