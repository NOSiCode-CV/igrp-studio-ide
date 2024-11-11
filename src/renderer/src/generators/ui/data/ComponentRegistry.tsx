import { UiButton, UiDate, UiText } from "../types/fields";
import FormLayout from "../types/containers/form";
import { COLUMN, COMPONENTS, FIELDS } from "../ComponentTypes";

export const ComponentRegistry: { [key: string]: React.FC<any> } = {
    [COMPONENTS.FORM]: FormLayout,
    [FIELDS.TEXT]: UiText,
    [FIELDS.DATE]: UiDate,
    [FIELDS.BUTTON]: UiButton
};

export const AcceptTypesRegistry: { [key: string]: string[] } = {
    [COMPONENTS.FORM]: [FIELDS.DATE, FIELDS.TEXT, FIELDS.BUTTON],
    [COMPONENTS.TABLE]: [FIELDS.DATE, FIELDS.TEXT, FIELDS.BUTTON],
    [COLUMN]: [COMPONENTS.FORM]
}