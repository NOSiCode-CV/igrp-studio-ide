import React, {  } from 'react';
import {
    COMPONENT,
    COMPONENTS,
    CONTAINER,
    FEILD,
    FIELDS,
} from '../ComponentTypes';
import {
    Layers,
    LayoutList,
    ListTodo,
    ListTree,
    Pencil,
    Sheet,
    Table,
} from 'lucide-react';

const Navdata = () => {

    const menuItems: any = [
        {
            id: CONTAINER.FORMS_LISTS,
            label: CONTAINER.FORMS_LISTS,
            icon: ListTodo,
            type: COMPONENT,
            subItems: [
                {
                    id: COMPONENTS.FORM,
                    label: 'Form',
                    icon: Sheet,
                    type: COMPONENTS.FORM,
                },
                {
                    id: 'formlist',
                    label: 'Form List',
                    icon: LayoutList,
                    type: COMPONENTS.FORMLIST,
                },
                {
                    id: 'separatorlist',
                    label: 'Separator List',
                    icon: '',
                    type: COMPONENTS.SEPARATOR_LIST,
                },
                {
                    id: 'table',
                    label: 'Table',
                    icon: Table,
                    type: COMPONENTS.TABLE,
                },
            ],
        },
        {
            id: CONTAINER.PAGE_ELEMENTS,
            label: CONTAINER.PAGE_ELEMENTS,
            icon: Layers,
            type: COMPONENT,
            subItems: [
                {
                    id: 'pageheader',
                    label: 'PageHeader',
                    icon: '',
                    type: COMPONENTS.PAGE_HEADER,
                },
                {
                    id: 'toolsbar',
                    label: 'ToolsBar',
                    icon: '',
                    type: COMPONENTS.TOOLSBAR,
                },
                {
                    id: 'treelist',
                    label: 'Tree List',
                    icon: ListTree,
                    type: COMPONENTS.TREELIST,
                },
                {
                    id: 'treemenu',
                    label: 'Tree Menu',
                    icon: '',
                    type: COMPONENTS.TREEMENU,
                },
                {
                    id: 'verticalmenu',
                    label: 'Vertical Menu',
                    icon: '',
                    type: COMPONENTS.VERTICAL_MENU,
                },
            ],
        },
        {
            id: CONTAINER.FIELDS,
            label: CONTAINER.FIELDS,
            icon: Pencil,
            type: FEILD,
            subItems: [
                {
                    id: FIELDS.TEXT,
                    label: 'Text',
                    icon: '',
                    type: FIELDS.TEXT,
                },
                {
                    id: FIELDS.DATE,
                    label: 'Date',
                    icon: '',
                    type: FIELDS.DATE,
                },
                {
                    id: FIELDS.BUTTON,
                    label: 'Button',
                    icon: '',
                    type: FIELDS.BUTTON,
                },
            ],
        },
    ];

    return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;
