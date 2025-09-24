import { useEffect, useState } from 'react';
import { IGRPCheckboxPrimitive, IGRPScrollAreaPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPTablePrimitive,
    IGRPTableBodyPrimitive,
    IGRPTableCellPrimitive,
    IGRPTableHeadPrimitive,
    IGRPTableHeaderPrimitive,
    IGRPTableRowPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { ColumnDef, IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { IGRPDataTable } from '@igrp/igrp-framework-react-design-system';
import useToast from '@renderer/hooks/useToast';
import { IGRPLabel } from '@igrp/igrp-framework-react-design-system';
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system';
import { toFullCamelCaseFromSnakeCase } from '@renderer/utils';
import { useTranslation } from 'react-i18next';
import { Connection } from 'src/main/types';

const actions = [
    {
        label: 'Overwrite',
        value: 'overwrite',
    },
    {
        label: 'Ignore',
        value: 'ignore',
    },
];

const ignoreTables = ['flyway_schema_history'];

export type Database = {
    id: string;
    tableName: string;
};

interface TableManagerProps {
    onRowsSubmit: (rows: Set<string>) => void;
    onSelectedConnection: (value: string) => void;
}

export function TableManager({
    onSelectedConnection,
    onRowsSubmit,
}: TableManagerProps) {
    const { t } = useTranslation();
    const { showErrorToast } = useToast();

    const [connections, setConnections] = useState<
        { label: string; value: string }[]
    >([]);
    const [selectedConnection, setSelectedConnection] = useState<string>('');
    const [tables, setTables] = useState<Array<any>>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [previewColumns, setPreviewColumns] = useState<Array<any>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [action, setAction] = useState('overwrite');
    const [selectedTables, setSelectedTables] = useState<Set<string>>(
        new Set()
    );

    useEffect(() => {
        const getConnections = async () => {
            const connections = await window.igrpStudio.connection.findAll();
            const maps = connections.map((conn: Connection) => {
                return {
                    label: conn.name,
                    value: conn.name,
                };
            });
            setConnections(maps);
        };
        getConnections();
    }, []);

    const handleCheckTableSelect = (tableName: string) => {
        setSelectedTables((prevSelectedTables) => {
            const newSelectedTables = new Set(prevSelectedTables);
            if (newSelectedTables.has(tableName)) {
                newSelectedTables.delete(tableName); // Remove if already selected
            } else {
                newSelectedTables.add(tableName); // Add if not selected
            }
            return newSelectedTables;
        });
    };

    const handleSelectAll = (isSelected: boolean) => {
        if (isSelected) {
            // Add all table names to the selectedTables set
            const allTableNames = tables.map((table) => table.tableName);
            setSelectedTables(new Set(allTableNames));
        } else {
            // Clear the selectedTables set
            setSelectedTables(new Set());
        }
    };

    const handleConnectionSelect = async (connectionName: string) => {
        setSelectedConnection(connectionName);
        onSelectedConnection(connectionName);

        setSelectedTable(null);
        setPreviewColumns([]);

        if (!connectionName) return;

        setIsLoading(true);

        try {
            const { success, tables, message } =
                await window.igrpStudio.connection.getTables(connectionName);
            if (success) {
                const tablesArr = tables
                    .filter((table: string) => !ignoreTables.includes(table))
                    .map((table: string) => {
                        return {
                            tableName: table,
                            id: table,
                            schemaName: toFullCamelCaseFromSnakeCase(table),
                        };
                    });
                setTables(tablesArr);
            }

            if (message) showErrorToast(message);
        } catch (error) {
            console.error('Error fetching tables:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTableSelect = async (table: string) => {
        setSelectedTable(table);
        const { success, message, structure } =
            await window.igrpStudio.connection.getTableStructure(
                selectedConnection,
                table
            );
        if (!success) showErrorToast(message);
        setPreviewColumns(structure);
    };

    useEffect(() => {
        onRowsSubmit(selectedTables);
    }, [selectedTables]);

    const columns: ColumnDef<Database>[] = [
        {
            id: 'select',
            accessorKey: 'tableName',
            header: ({ table }) => (
                <IGRPCheckboxPrimitive
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={(value) => {
                        table.toggleAllPageRowsSelected(!!value);
                        handleSelectAll(!!value);
                    }}
                    aria-label={t('selectAll')}
                />
            ),
            cell: ({ row }) => (
                <IGRPCheckboxPrimitive
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => {
                        row.toggleSelected(!!value);
                        handleTableSelect(row.original.tableName);
                        handleCheckTableSelect(row.original.tableName);
                    }}
                    aria-label={t('selectRow')}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            header: t('dataTableName'),
            accessorKey: 'tableName',
            cell: ({ row }) => (
                <div onClick={() => handleTableSelect(row.original.tableName)}>
                    {row.original.tableName}
                </div>
            ),
        },
        {
            header: t('modifiedSchemaName'),
            accessorKey: 'schemaName',
        },
    ];

    return (
        <>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                    <IGRPLabel>{t('databaseConnections')}</IGRPLabel>
                    <IGRPCombobox
                        value={selectedConnection}
                        onChange={(selected) => {
                            handleConnectionSelect(selected as string);
                        }}
                        placeholder={t('selectConnection')}
                        options={connections}
                        className="w-full"
                    />
                </div>
                <div className="space-y-2">
                    <IGRPLabel className="text-xs">
                        {t('whileMatchingSchema')}
                    </IGRPLabel>
                    <IGRPCombobox
                        value={action}
                        onChange={(value) => setAction(value as string)}
                        placeholder={t('selectAction')}
                        options={actions}
                        className="w-full"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="space-y-4">
                    <div className="rounded border">
                        <h4 className="p-2 text-sm">{t('databaseTable')}</h4>
                        <IGRPSeparator />
                        <IGRPScrollAreaPrimitive className="h-[450px] w-full px-2">
                            {isLoading ? (
                                <div className="text-center">
                                    {t('loadingTables')}
                                </div>
                            ) : (
                                <IGRPDataTable
                                    columns={columns}
                                    data={tables}
                                />
                            )}
                        </IGRPScrollAreaPrimitive>
                    </div>
                </div>
                <div className="space-y-3">
                    {selectedTable ? (
                        <>
                            <h3 className="text-sm text-muted-foreground">
                                {t('previewTable', {
                                    tableName: selectedTable,
                                })}
                            </h3>
                            <IGRPScrollAreaPrimitive className="h-[450px] rounded-md border">
                                <IGRPTablePrimitive>
                                    <IGRPTableHeaderPrimitive>
                                        <IGRPTableRowPrimitive>
                                            <IGRPTableHeadPrimitive>{t('column')}</IGRPTableHeadPrimitive>
                                            <IGRPTableHeadPrimitive>
                                                {t('dataType')}
                                            </IGRPTableHeadPrimitive>
                                            <IGRPTableHeadPrimitive>
                                                {t('isNullable')}
                                            </IGRPTableHeadPrimitive>
                                        </IGRPTableRowPrimitive>
                                    </IGRPTableHeaderPrimitive>
                                    <IGRPTableBodyPrimitive>
                                        {previewColumns && previewColumns.map((column, key) => (
                                            <IGRPTableRowPrimitive key={key}>
                                                <IGRPTableCellPrimitive>
                                                    {column?.name}
                                                </IGRPTableCellPrimitive>
                                                <IGRPTableCellPrimitive>
                                                    {column?.data_type}
                                                </IGRPTableCellPrimitive>
                                                <IGRPTableCellPrimitive>
                                                    {column?.is_nullable
                                                        ? t('yes')
                                                        : t('no')}
                                                </IGRPTableCellPrimitive>
                                            </IGRPTableRowPrimitive>
                                        ))}
                                    </IGRPTableBodyPrimitive>
                                </IGRPTablePrimitive>
                            </IGRPScrollAreaPrimitive>
                        </>
                    ) : (
                        <div className="h-[500px] flex items-center justify-center text-muted-foreground text-sm">
                            {t('selectTableToPreview')}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
