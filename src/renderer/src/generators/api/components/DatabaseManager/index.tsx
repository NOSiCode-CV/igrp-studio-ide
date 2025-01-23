import React, { useState } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { TableManager } from './TableManager';
import { ConnectionManager } from './ConnectionManager';
import { Button } from '@renderer/components/ui/button';
import { getValuesToSubmit, initialValues } from '../../pages/model/config';
import useToast from '@renderer/components/useToast';
import { useTranslation } from 'react-i18next';
import { toFullCamelCaseFromSnakeCase } from '@renderer/utils/helpers';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useDispatch } from 'react-redux';

interface DatabaseManagerModalProps {
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
    item?: any;
    basePath?: string;
}

const typeMapping = {
    'character varying': 'string',
    text: 'string',
    integer: 'integer',
    bigint: 'long',
    smallint: 'short',
    boolean: 'boolean',
    decimal: 'decimal',
    numeric: 'decimal',
    real: 'float',
    'double precision': 'double',
    'timestamp without time zone': 'datetime',
    'timestamp with time zone': 'datetime',
    date: 'date',
    'time without time zone': 'time',
    'time with time zone': 'time',
    uuid: 'uuid',
    bytea: 'file',
};

const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
    isOpen = false,
    setIsOpen,
    item,
    basePath,
}) => {
    const [selectedRows, setSelectedRows] = useState({}); // Track selected rows
    const [selectedConnection, setSelectedConnection] = useState<string>('');
    const { showErrorToast, showSuccessToast } = useToast();
    const { t } = useTranslation();
    const dispatch: any = useDispatch();

    const handleClickSubmit = async () => {
        if (!basePath) return;

        const errorMessages: string[] = [];
        const processedTables = new Set<string>();

        const processTable = async (tableName: string) => {
            if (processedTables.has(tableName)) return;
            processedTables.add(tableName);

            try {
                const { success, message, structure } =
                    await window.api.getTableStructure(
                        selectedConnection,
                        tableName
                    );

                if (success) {
                    // Map the attributes
                    const attributes = structure
                        .filter(() => true) // Add filter logic here if needed
                        .map((column) => {
                            const relation = column.foreign_key_table
                                ? {
                                      type: 'ManyToOne',
                                      entity: toFullCamelCaseFromSnakeCase(
                                          column.foreign_key_table
                                      ),
                                      referencedColumnName:
                                          column.foreign_key_column,
                                      joinTable: '',
                                      inverseJoinColumn: '',
                                      cardinality: 'oneWay',
                                  }
                                : null;

                            return {
                                name: column.name || '',
                                type: relation
                                    ? 'relation'
                                    : typeMapping[column.data_type] || 'string', // Map types
                                length: column.max_length || null,
                                defaultValue: !column.is_primary_key
                                    ? column.default_value
                                    : '',
                                nullable: column.is_nullable ?? true, // Use nullish coalescing for better accuracy
                                unique: column.is_unique || false,
                                primaryKey: column.is_primary_key || false,
                                relation, // Add the relation if it exists
                                generationType: column.is_primary_key
                                    ? 'IDENTITY'
                                    : null,
                            };
                        });

                    // Add referenced foreign_key_table to selectedRows dynamically if not present
                    for (const column of structure.filter(
                        (col) => col.foreign_key_table
                    )) {
                        const foreignKeyTable = column.foreign_key_table;
                        if (!selectedRows[foreignKeyTable]) {
                            selectedRows[foreignKeyTable] = true; // Add to the list
                            await processTable(foreignKeyTable); // Recursive call
                        }
                    }

                    // Final table object
                    const tableJson = {
                        ...initialValues,
                        tableName: tableName,
                        attributes,
                        name:
                            tableName.charAt(0).toUpperCase() +
                            tableName.slice(1), // Capitalize table name
                    };

                    const values = getValuesToSubmit(tableJson, item.module);

                    const { error } = await window.api.createModel(
                        values,
                        basePath
                    );

                    if (error) errorMessages.push(error);
                } else {
                    console.error(
                        `Failed to fetch structure for table: ${tableName}. Message: ${message}`
                    );
                }
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : 'An unknown error occurred';
                errorMessages.push(message);
            }
        };

        // Process all initially selected rows
        for (const key in selectedRows) {
            if (Object.hasOwn(selectedRows, key)) {
                await processTable(key);
            }
        }

        if (errorMessages.length > 0) {
            errorMessages.forEach((errMsg) => {
                showErrorToast(errMsg);
            });
        } else {
            dispatch(onSetChangeStatus(true));
            showSuccessToast(t('schemaCreatedSuccess'));
        }
    };

    const handleClose = () => {
        if (setIsOpen) setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                className="max-w-[900px]"
                onClick={(e) => e.stopPropagation()}
            >
                <DialogHeader>
                    <DialogTitle>Import data table from database</DialogTitle>
                    <DialogDescription>
                        Manage your database connections and import data tables.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="tables" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="tables">
                            Import Data Tables
                        </TabsTrigger>
                        <TabsTrigger value="connections">
                            Manage Connections
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="tables">
                        <TableManager
                            onRowsSubmit={setSelectedRows}
                            onSelectedConnection={setSelectedConnection}
                        />
                    </TabsContent>
                    <TabsContent value="connections">
                        <ConnectionManager />
                    </TabsContent>
                </Tabs>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleClose}
                        >
                            Close
                        </Button>
                    </DialogClose>
                    <Button type="submit" onClick={handleClickSubmit}>
                        OK
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DatabaseManagerModal;
