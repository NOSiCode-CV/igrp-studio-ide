import React, { useEffect, useState } from "react";
import { COMPONENT, COMPONENTS, CONTAINER, FEILD, FIELDS } from "../ComponentTypes";

const Navdata = () => {

    //state data
    const [isFormLayout, setIsFormLayout] = useState<boolean>(true);
    const [isFormAction, setIsFormAction] = useState<boolean>(false);
    const [isFormFields, setIsFormFields] = useState<boolean>(false);

    const [iscurrentState, setIscurrentState] = useState(CONTAINER.FORMS_LISTS);

    function updateIconSidebar(e: any) {
        if (e && e.target && e.target.getAttribute("sub-items")) {
            const ul: any = document.getElementById("two-column-menu");
            const iconItems: any = ul.querySelectorAll(".nav-icon.active");
            let activeIconItems = [...iconItems];
            activeIconItems.forEach((item) => {
                item.classList.remove("active");
                var id = item.getAttribute("sub-items");
                const getID = document.getElementById(id) as HTMLElement;
                if (getID)
                    getID.classList.remove("show");
            });
        }
    }

    useEffect(() => {
        document.body.classList.remove('twocolumn-panel');
        if (iscurrentState !== CONTAINER.FORMS_LISTS) {
            setIsFormLayout(false);
        }
        if (iscurrentState !== CONTAINER.PAGE_ELEMENTS) {
            setIsFormAction(false);
        }
        if (iscurrentState !== CONTAINER.FIELDS) {
            setIsFormFields(false);
        }
    }, [
        iscurrentState,
        isFormAction,
        isFormAction,
        isFormFields
    ]);

    const menuItems: any = [
        {
            id: CONTAINER.FORMS_LISTS,
            label: CONTAINER.FORMS_LISTS,
            icon: "ri-list-check-2",
            link: "/#",
            stateVariables: isFormLayout,
            type: COMPONENT,
            click: function (e: any) {
                e.preventDefault();
                setIsFormLayout(!isFormLayout);
                setIscurrentState(CONTAINER.FORMS_LISTS);
                updateIconSidebar(e);
            },
            subItems: [
                {
                    id: COMPONENTS.FORM,
                    label: "Form",
                    icon: "ri-file-list-3-line",
                    type: COMPONENTS.FORM,
                },
                {
                    id: "formlist",
                    label: "Form List",
                    icon: " ri-article-line",
                    type: COMPONENTS.FORMLIST,
                },
                {
                    id: "separatorlist",
                    label: "Separator List",
                    icon: " ri-list-unordered",
                    type: COMPONENTS.SEPARATOR_LIST
                },
                {
                    id: "table",
                    label: "Table",
                    icon: "ri-table-2",
                    type: COMPONENTS.TABLE
                }
            ]
        },
        {
            id: CONTAINER.PAGE_ELEMENTS,
            label: CONTAINER.PAGE_ELEMENTS,
            icon: "ri-stack-line",
            link: "/#",
            stateVariables: isFormAction,
            type: COMPONENT,
            click: function (e: any) {
                e.preventDefault();
                setIsFormAction(!isFormAction);
                setIscurrentState(CONTAINER.PAGE_ELEMENTS);
                updateIconSidebar(e);
            },
            subItems: [
                {
                    id: "toolsbar",
                    label: "ToolsBar",
                    icon: "fa-container",
                    type: COMPONENTS.TOOLSBAR
                },
                {
                    id: "treelist",
                    label: "Tree List",
                    icon: "fa-container",
                    type: COMPONENTS.TREELIST
                },
                {
                    id: "treemenu",
                    label: "Tree Menu",
                    icon: "fa-container",
                    type: COMPONENTS.TREEMENU
                },
                {
                    id: "verticalmenu",
                    label: "Vertical Menu",
                    icon: "fa-container",
                    type: COMPONENTS.VERTICAL_MENU
                }
            ]
        },
        {
            id: CONTAINER.FIELDS,
            label: CONTAINER.FIELDS,
            icon: "ri-pencil-ruler-2-line",
            link: "/#",
            stateVariables: isFormFields,
            type: FEILD,
            click: function (e: any) {
                e.preventDefault();
                setIsFormFields(!isFormFields);
                setIscurrentState(CONTAINER.FIELDS);
                updateIconSidebar(e);
            },
            subItems: [
                {
                    id: FIELDS.TEXT,
                    label: "Text",
                    icon: "ri-edit-box-line",
                    type: FIELDS.TEXT
                },
                {
                    id: FIELDS.DATE,
                    label: "Date",
                    icon: "ri-calendar-line",
                    type: FIELDS.DATE,
                },
                {
                    id: FIELDS.BUTTON,
                    label: "Button",
                    icon: " bx bx-square-rounded",
                    type: FIELDS.BUTTON
                }
            ]
        }
    ];

    return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;

