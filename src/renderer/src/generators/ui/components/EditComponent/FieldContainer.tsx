import { Col, Row } from "reactstrap"
import { AcceptTypesRegistry } from "../../data/ComponentRegistry"
import Navdata from "../../data/ConfigData"
import { findComponentItem, generateId } from "@renderer/utils/helpers"
import { useDroppedComponents } from "../../dnd/DroppedComponentsContext"
import { DroppedComponent } from "../../interfaces"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Field, FieldConfig } from "@igrp/nextjs-engine/dist/interfaces/types"
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { FIELDS } from "../../ComponentTypes"
import FormSearch from "@renderer/layouts/components/app-search"
import { ScrollArea } from "@radix-ui/react-scroll-area"


const FieldContainer = ({ componentName, componentId, fields }) => {

    const { t } = useTranslation();
    const { currentComponent, setEditingComponent } = useDroppedComponents();
    const [searchQuery, setSearchQuery] = useState("");

    if (!currentComponent) {
        return null;
    }

    const items = Navdata().props.children;
    const acceptTypes = AcceptTypesRegistry[componentName];

    if (!acceptTypes) return;

    const onclickToAdd = (item: any) => {

        const fieldId = generateId(componentId + '_' + item.type);

        const fieldConfig: FieldConfig = {
            type: item.type,
            name: fieldId,
            label: item.label,
            placeholder: `Enter your ${item.label}`,
            colSize: 4
        }

        const field: Field = {
            type: item.type,
            config: fieldConfig
        }

        const newField: DroppedComponent = {
            id: fieldId,
            componentName: item.type,
            ...field,
        };

        const updatedFields = [
            ...fields,
            newField
        ];

        const updatedComponent: Partial<DroppedComponent> = {
            ...currentComponent,
            fields: updatedFields
        };

        setEditingComponent(updatedComponent);
    }

    const filteredAcceptTypes = acceptTypes.filter((element) => {
        const field = findComponentItem(items, element);
        return field && field.label.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleDelete = (index: number) => {
        const updatedFields = fields.filter((_, fieldIndex) => fieldIndex !== index);

        const updatedComponent: Partial<DroppedComponent> = {
            ...currentComponent,
            fields: updatedFields,
        };

        setEditingComponent(updatedComponent);
    };

    // Split fields into buttons and others
    const buttonFields = fields.filter((field) => field.config?.type === FIELDS.BUTTON);
    const otherFields = fields.filter((field) => field.config?.type !== FIELDS.BUTTON);

    // Function to render fields by type
    const renderFieldsByType = (type: string, fieldsArray: any[], title: string) => {
        return fieldsArray.length > 0 && (
            <div className="mt-4">
                <h6>{t(title)}</h6>
                <Droppable droppableId={`${componentId}-${type}`}>
                    {(provided: any) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                            <ul className="list-group list-group-flush">
                                {fieldsArray.map((comp: any, index: number) => (
                                    <Draggable key={comp.id} draggableId={comp.id} index={index}>
                                        {(provided: any) => (
                                            <li
                                                className="list-group-item py-2"
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                            >
                                                <div className="d-flex align-items-center">
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex">
                                                            <div
                                                                className="flex-shrink-0 text-muted align-middle pt-2 me-1"
                                                                {...provided.dragHandleProps}
                                                            >
                                                                <i className="ri-drag-move-2-line" />
                                                            </div>
                                                            <div className="flex-shrink-0 ms-2">
                                                                <h6 className="fs-14 mb-0">{comp.config?.label}</h6>
                                                                <small className="text-muted">{comp.config?.type}</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 hstack flex-wrap ">
                                                        <button className="link-success fs-15 btn btn-link py-0">
                                                            <i className="ri-edit-2-line"></i>
                                                        </button>
                                                        <button
                                                            className="link-danger fs-15 pe-auto btn btn-link py-0"
                                                            onClick={() => handleDelete(index)}
                                                        >
                                                            <i className="ri-delete-bin-line"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        )}
                                    </Draggable>
                                ))}
                            </ul>
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        )
    };


    return (
        <div className="field-container -px-3">
            <Row className="mx-0">
                <Col md="4" className="igrp-bg-light mt-n3 mb-n5 py-3">
                    <FormSearch  onSearch={(value) => setSearchQuery(value)} />
                    <div className="px-2">
                        <h6 className="text-white">{t('availableFields')}</h6>
                        <div className="mb-2 pb-2 small"><small>{t('clickToAdd')}</small></div>
                    </div>
                    <div className="fields-warraper" style={{ maxHeight: "60vh" }}>
                        <ScrollArea id="fields" className="h-100">
                            <Row className="g-2 mx-0">
                                {filteredAcceptTypes.length > 0 ? (
                                    filteredAcceptTypes.map((element, index) => {
                                        const field = findComponentItem(items, element)
                                        return (
                                            field && (
                                                <Col md="6" key={index}>
                                                    <div className="cursor-pointer text-truncate d-flex flex-column align-items-center justify-content-center pt-3 pb-2 border border-dark-subtle rounded"
                                                        onClick={() => onclickToAdd(field)}>
                                                        <i className={`${field.icon}`}></i>
                                                        <span className="text-truncate">{t(field.label)}</span>
                                                    </div>
                                                </Col>
                                            )
                                        )
                                    })
                                ) : (
                                    <div className="mb-3 pb-2 small">
                                        <small>{t("noResultsFound")}</small>
                                    </div>
                                )}
                            </Row>
                        </ScrollArea>
                    </div>
                </Col>
                <Col md="8" style={{ maxHeight: "60vh" }}>
                    <ScrollArea id="fields-added" className="h-100">
                        {/* Render other fields */}
                        {renderFieldsByType("others", otherFields, "currentFields")}

                        {/* Render button fields */}
                        {renderFieldsByType("buttons", buttonFields, "currentButtons")}

                        {fields.length === 0 && (
                            <div className="mb-3 pb-2 small">
                                <small>{t('addFieldHint')}</small>
                            </div>
                        )}
                    </ScrollArea>
                </Col>
            </Row>
        </div >
    )
}

export default FieldContainer