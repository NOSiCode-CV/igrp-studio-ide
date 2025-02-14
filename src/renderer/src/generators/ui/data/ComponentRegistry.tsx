import { UiButton, UiDate, UiText } from '../types/fields';
import { COLUMN, COMPONENTS, FIELDS } from '../ComponentTypes';
import { lazy } from 'react';

const PageHeaderLayout = lazy(() => import('../types/containers/pageHeader'));
const FormLayout = lazy(() => import('../types/containers/form'));

export const ComponentRegistry: { [key: string]: React.FC<any> } = {
    [COMPONENTS.FORM]: FormLayout,
    [COMPONENTS.PAGE_HEADER]: PageHeaderLayout,
    [FIELDS.TEXT]: UiText,
    [FIELDS.DATE]: UiDate,
    [FIELDS.BUTTON]: UiButton,
};

export const AcceptTypesRegistry: { [key: string]: string[] } = {
    [COMPONENTS.FORM]: [FIELDS.DATE, FIELDS.TEXT, FIELDS.BUTTON],
    [COMPONENTS.TABLE]: [FIELDS.DATE, FIELDS.TEXT, FIELDS.BUTTON],
    [COLUMN]: [COMPONENTS.FORM, COMPONENTS.PAGE_HEADER],
    [COMPONENTS.PAGE_HEADER]: [FIELDS.BUTTON],
};
