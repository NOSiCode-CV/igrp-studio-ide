import { COLUMN, COMPONENTS, FIELDS } from "@renderer/utils/ComponentTypes";
import { UiButton, UiDate, UiText } from "../types/fields";
import FormLayout from "../types/containers/form";
import TableLayout from "../types/containers/table";

export const ComponentRegistry: { [key: string]: React.FC<any> } = {
    [COMPONENTS.FORM]: FormLayout,
    [COMPONENTS.TABLE]: TableLayout,
    [FIELDS.TEXT]: UiText,
    [FIELDS.DATE]: UiDate,
    [FIELDS.BUTTON]: UiButton
};

export const AcceptTypesRegistry: { [key: string]: string[] } = {
    [COMPONENTS.FORM]: [FIELDS.DATE, FIELDS.TEXT, FIELDS.BUTTON],
    [COMPONENTS.TABLE]: [FIELDS.DATE, FIELDS.TEXT, FIELDS.BUTTON],
    [COLUMN]: [COMPONENTS.FORM]
}