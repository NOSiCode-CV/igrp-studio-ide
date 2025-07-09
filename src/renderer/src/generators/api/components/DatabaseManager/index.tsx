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
import useToast from '@renderer/hooks/useToast';
import { useTranslation } from 'react-i18next';
import { getId, toFullCamelCaseFromSnakeCase } from '@renderer/utils';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useDispatch } from 'react-redux';
import { useGit } from '@renderer/hooks/use-git';
import { ENV_TYPES } from '@renderer/constants/appConstants';

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
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set()); // Track selected rows
    const [selectedConnection, setSelectedConnection] = useState<string>('');
    const { showErrorToast, showSuccessToast } = useToast();
    const { t } = useTranslation();
    const { createGitCommit } = useGit();
    const dispatch: any = useDispatch();

    const { module } = item;

    const handleClickSubmit = async () => {
        if (!basePath) return;

        const errorMessages: string[] = [];
        const processedTables = new Set<string>();

        const processTable = async (tableName: string) => {
            if (processedTables.has(tableName)) return;
            processedTables.add(tableName);

            try {
                const { success, message, structure } =
                    await window.igrpStudio.connection.getTableStructure(
                        selectedConnection,
                        tableName
                    );

                if (success) {
                    // Map the attributes
                    const attributes = structure
                        .filter(() => true)
                        .map((column: any) => {
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
                                      module,
                                  }
                                : null;

                            return {
                                name: column.name || '',
                                type: relation
                                    ? 'relation'
                                    : typeMapping[column.data_type as keyof typeof typeMapping] || 'string', // Map types
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
                        (col: any) => col.foreign_key_table
                    )) {
                        const foreignKeyTable = column.foreign_key_table;
                        if (!selectedRows.has(foreignKeyTable)) {
                            selectedRows.add(foreignKeyTable); // Add to the list
                            await processTable(foreignKeyTable);
                        }
                    }

                    const tableJson = {
                        ...initialValues,
                        id: getId(),
                        tableName: tableName,
                        attributes,
                        name:
                            tableName.charAt(0).toUpperCase() +
                            tableName.slice(1),
                    };

                    const values = getValuesToSubmit(tableJson, module);

                    const { error } = await window.engine.createModel(
                        values,
                        ENV_TYPES.SPRING,
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
        for (const tableName of selectedRows) {
            processTable(tableName);
        }

        if (errorMessages.length > 0) {
            errorMessages.forEach((errMsg: string) => {
                showErrorToast(errMsg);
            });
        } else {
            createGitCommit(basePath, `Import data tables`);
            dispatch(onSetChangeStatus(true));
            showSuccessToast(t('schemaCreatedSuccess'));
        }
    };

    const handleClose = () => {
        setIsOpen?.(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                className="sm:max-w-[600px] md:max-w-[900px] max-w-5xl"
                onClick={(e) => e.stopPropagation()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {t('importDataTableFromDatabase')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('manageDatabaseConnections')}
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="tables" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="tables">
                            {t('importDataTables')}
                        </TabsTrigger>
                        <TabsTrigger value="connections">
                            {t('manageConnections')}
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
                            {t('close')}
                        </Button>
                    </DialogClose>
                    <Button type="submit" onClick={handleClickSubmit}>
                        {t('save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DatabaseManagerModal;
