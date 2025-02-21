import { AcceptTypesRegistry } from "../../data/ComponentRegistry"
import Navdata from "../../data/useConfigData"
import { findComponentItem, generateId } from "@renderer/utils/helpers"
import { useDroppedComponents } from "../../dnd/DroppedComponentsContext"
import { DroppedComponent } from "../../interfaces"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Field, FieldConfig } from "@igrp/nextjs-engine/dist/interfaces/types"
import { Draggable, Droppable } from "@hello-pangea/dnd"
import { FIELDS } from "../../ComponentTypes"
import { ScrollArea } from "@renderer/components/ui/scroll-area"
import { Edit, GripHorizontal, Move, Trash } from "lucide-react"
import { Input } from "@renderer/components/ui/input"

const FieldContainer = ({ componentName, componentId, fields }) => {
    const { t } = useTranslation()
    const { currentComponent, setEditingComponent } = useDroppedComponents()
    const [searchQuery, setSearchQuery] = useState("")

    if (!currentComponent) {
        return null
    }

    const items = Navdata().props.children
    const acceptTypes = AcceptTypesRegistry[componentName]

    if (!acceptTypes) return

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const onclickToAdd = (item: any) => {
        const fieldId = generateId(componentId + "_" + item.type)

        const fieldConfig: FieldConfig = {
            type: item.type,
            name: fieldId,
            label: item.label,
            placeholder: `Enter your ${item.label}`,
            colSize: 4,
        }

        const field: Field = {
            type: item.type,
            config: fieldConfig,
        }

        const newField: DroppedComponent = {
            id: fieldId,
            componentName: item.type,
            ...field,
        }

        const updatedFields = [...fields, newField]

        const updatedComponent: Partial<DroppedComponent> = {
            ...currentComponent,
            fields: updatedFields,
        }

        setEditingComponent(updatedComponent)
    }

    const filteredAcceptTypes = acceptTypes.filter((element) => {
        const field = findComponentItem(items, element)
        return field && field?.label.toLowerCase().includes(searchQuery?.toLowerCase())
    })

    const handleDelete = (index: number) => {
        const updatedFields = fields.filter((_, fieldIndex) => fieldIndex !== index)

        const updatedComponent: Partial<DroppedComponent> = {
            ...currentComponent,
            fields: updatedFields,
        }

        setEditingComponent(updatedComponent)
    }

    // Split fields into buttons and others
    const buttonFields = fields.filter((field) => field.config?.type === FIELDS.BUTTON)
    const otherFields = fields.filter((field) => field.config?.type !== FIELDS.BUTTON)

    const renderFieldsByType = (type: string, fieldsArray: any[], title: string) => {
        return (
            fieldsArray.length > 0 && (
                <div className="mt-4 pr-3">
                    <h6>{t(title)}</h6>
                    <Droppable droppableId={`${componentId}-${type}`}>
                        {(provided: any) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                <ul className="list-none">
                                    {fieldsArray.map((comp: any, index: number) => (
                                        <Draggable
                                            key={comp.id}
                                            draggableId={comp.id}
                                            index={index}
                                        >
                                            {(provided: any) => (
                                                <li
                                                    className="py-2 border-b last:border-b-0"
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                >
                                                    <div className="flex items-center align-middle">
                                                        <div className="flex-grow">
                                                            <div className="flex align-middle">
                                                                <div
                                                                    className="text-gray-400 cursor-move mt-3 mr-2 align-middle"
                                                                    {...provided.dragHandleProps}
                                                                >
                                                                    <Move className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <h6 className="text-sm font-semibold">
                                                                        {comp.config?.label}
                                                                    </h6>
                                                                    <small className="text-gray-500">
                                                                        {comp.config?.type}
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button className="text-green-600">
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                className="text-red-600"
                                                                onClick={() => handleDelete(index)}
                                                            >
                                                                <Trash className="h-4 w-4" />
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
        )
    }

    return (
        <div className="flex flex-1 md:flex-row gap-4 max-h-[370px]">
            {/* Sidebar */}
            <div className="bg-gray-100 p-4 rounded w-1/3 space-y-2">
                <Input onChange={handleInputChange} placeholder="Type to search" />
                <div className="flex flex-col">
                    <small className="text-gray-800">{t("availableFields")}</small>
                    <small className="text-gray-600 italic">{t("clickToAdd")}</small>
                </div>
                <div className="overflow-y-auto">
                    <ScrollArea id="fields" className="h-full">
                        <div className="grid grid-cols-2 gap-2">
                            {filteredAcceptTypes.length > 0 ? (
                                filteredAcceptTypes.map((element, index) => {
                                    const field = findComponentItem(items, element)
                                    return (
                                        field && (
                                            <div
                                                key={index}
                                                className="flex flex-col items-center justify-center p-3 border rounded cursor-pointer"
                                                onClick={() => onclickToAdd(field)}
                                            >
                                                {field.icon ? (<field.icon className="h-4 w-4" />) : (<GripHorizontal className="h-4 w-4" />)}
                                                <span className="truncate text-sm">
                                                    {t(field.label)}
                                                </span>
                                            </div>
                                        )
                                    )
                                })
                            ) : (
                                <small>{t("noResultsFound")}</small>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Fields Section */}
            <div className="w-2/3">
                <ScrollArea id="fields-added" className="h-full">
                    {/* Render Other Fields */}
                    {renderFieldsByType("others", otherFields, "currentFields")}

                    {/* Render Button Fields */}
                    {renderFieldsByType("buttons", buttonFields, "currentButtons")}

                    {fields.length === 0 && (
                        <small className="italic">{t("addFieldHint")}</small>
                    )}
                </ScrollArea>
            </div>
        </div>
    )
}

export default FieldContainer