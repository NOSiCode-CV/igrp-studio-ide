import { useEffect, useState } from 'react';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@renderer/components/ui/table';
import { IGRPCombobox } from '@renderer/components/combobox';
import { IGRPDataTable } from '@igrp/igrp-framework-react-design-system';
import useToast from '@renderer/components/useToast';
import { Label } from '@renderer/components/ui/label';
import { Separator } from '@renderer/components/ui/separator';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { toFullCamelCaseFromSnakeCase } from '@renderer/utils/helpers';
import { useTranslation } from 'react-i18next';
import { Connection } from 'src/main/types';
import { ColumnDef } from '@igrp/igrp-framework-react-design-system/dist/types/globals';

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
            const connections = await window.repo.connection.findAll();
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
                await window.api.getTables(connectionName);
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
            await window.api.getTableStructure(selectedConnection, table);
        if (!success) showErrorToast(message);
        setPreviewColumns(structure);
    };

    useEffect(() => {
        console.log(selectedTables);
        onRowsSubmit(selectedTables);
    }, [selectedTables]);

    const columns: ColumnDef<Database>[] = [
        {
            id: 'select',
            accessorKey: 'tableName',
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={(value) =>
                       {
                        table.toggleAllPageRowsSelected(!!value)
                        handleSelectAll(!!value);
                       }
                    }
                    aria-label={t('selectAll')}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
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
                    <Label>{t('databaseConnections')}</Label>
                    <IGRPCombobox
                        value={selectedConnection}
                        onChange={(selected) => {
                            handleConnectionSelect(selected);
                        }}
                        placeholder={t('selectConnection')}
                        options={connections}
                        className="w-full"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs">
                        {t('whileMatchingSchema')}
                    </Label>
                    <IGRPCombobox
                        value={action}
                        onChange={(value) => setAction(value)}
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
                        <Separator />
                        <ScrollArea className="h-[450px] w-full px-2">
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
                        </ScrollArea>
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
                            <ScrollArea className="h-[450px] rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('column')}</TableHead>
                                            <TableHead>
                                                {t('dataType')}
                                            </TableHead>
                                            <TableHead>
                                                {t('isNullable')}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewColumns.map((column, key) => (
                                            <TableRow key={key}>
                                                <TableCell>
                                                    {column?.name}
                                                </TableCell>
                                                <TableCell>
                                                    {column?.data_type}
                                                </TableCell>
                                                <TableCell>
                                                    {column?.is_nullable
                                                        ? t('yes')
                                                        : t('no')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
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
