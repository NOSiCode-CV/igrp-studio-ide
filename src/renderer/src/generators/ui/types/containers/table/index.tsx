import React, { useEffect, useState } from 'react';
import GenNoInfoField from '../../../components/GenNoInfoField';
import { Card, CardBody, CardHeader, CardTitle } from 'reactstrap';
import { DroppedComponent } from '../../../interfaces';
import { useDroppedComponents } from '../../../dnd/DroppedComponentsContext';
import { FEILD, FIELDS } from '@renderer/utils/ComponentTypes';
import { Droppable } from 'react-beautiful-dnd';
import { DefaultTable } from '@igrp/nosi-velzon-ts';
import { Link } from 'react-router-dom';
import { faker } from '@faker-js/faker';
import { generateFakeDataForField } from '@renderer/utils/helpers';

const NUM_FAKE_ROWS = 3; // Number of rows to generate

const getItemStyle = (isDragging, draggableStyle, index) => ({
    userSelect: 'none',
    background: isDragging ? 'lightgreen' : '',
    ...draggableStyle,
    maxWidth: index === 0 ? window.innerWidth : window.innerWidth / 2,
    overflow: "hidden"
});

const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? "lightblue" : "",
    border: isDraggingOver ? '2px dashed blue' : 'none',
    display: "flex"
});

type TableContentType = {
    [key: string]: string;
};

export interface FormComponentProps {
    componentName: string,
    componentId: string,
    acceptTypes: string[],
    comp: DroppedComponent,
    onEdit: () => void
}

const TableLayout: React.FC<FormComponentProps> = ({ comp, componentId }) => {

    if (!componentId) return null;

    const [tableContent, setTableContent] = useState<TableContentType[]>([]);
    const [tableColumns, setTableColumns] = useState([]);
    const [buttonComponents, setButtonComponents] = useState<DroppedComponent[]>([]);

    const { setEditingComponent } = useDroppedComponents();
    const { title } = comp.config;

    useEffect(() => {
        if (comp.fields) {
            const fields = comp.fields;
            const buttons = fields.filter((field: any) => field.componentName === FIELDS.BUTTON);
            const otherFields = fields.filter((field: any) => field.componentName !== FIELDS.BUTTON);

            const columns = otherFields.map(field => ({
                header: field.config.label || field.config.name,
                accessorKey: field.config.name
            }));

            // Generate fake data based on otherFields
            const generatedData = Array.from({ length: NUM_FAKE_ROWS }, () => {
                const row: any = {};
                otherFields.forEach(field => {
                    row[field.config.name] = generateFakeDataForField(field);
                });
                return row;
            });

            setTableContent(generatedData);

            setTableColumns(columns);
            setButtonComponents(buttons);
        }
    }, [comp]);

    const handleEditClick = (component: Partial<DroppedComponent>) => {
        setEditingComponent(component);
    };

    const onClickOthersBtn = (item: any) => {
        console.log(item);
    };

    const actions = (cell: any) => {

        return (
            <ul className="list-inline hstack gap-2 mb-0">
                {buttonComponents.map(button => (
                    <li key={button.id} className="list-inline-item edit" title={button.config.label || 'Button'}>
                        <Link to="#" className="text-muted d-inline-block"
                            onClick={() => { const item = cell.row.original; onClickOthersBtn(item); }}>
                            <i className={button.config.icon ||  "ri-arrow-right-s-line fs-6"}></i>
                        </Link>
                    </li>
                ))}
            </ul>
        )
    };

    return (
        <Card className='igrp-table mb-0'>
            <CardHeader className='pb-1'>
                <CardTitle className='fs-13'>{title}</CardTitle>
            </CardHeader>
            <CardBody className='p-0'>
                <Droppable droppableId={`${componentId}`}
                    type={FEILD}
                >
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            role="table"
                            className="row"
                            style={getListStyle(snapshot.isDraggingOver)}
                        >
                            {tableColumns.length > 0 ? (
                                <DefaultTable content={tableContent} columns={tableColumns} actions={actions} />
                            ) : (
                                <GenNoInfoField />
                            )}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </CardBody>
        </Card>
    );
};

export default TableLayout;
