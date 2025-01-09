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
import { Combobox, IGRPDataTable } from '@igrp/igrp-design-system';
import useToast from '@renderer/components/useToast';
import { Label } from '@renderer/components/ui/label';
import { Separator } from '@renderer/components/ui/separator';
import { ColumnDef } from '@igrp/igrp-design-system/dist/types';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { toFullCamelCaseFromSnakeCase } from '@renderer/utils/helpers';

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

export type Database = {
    id: string;
    tableName: string;
};

interface TableManagerProps {
    onRowsSubmit: (rows: any[]) => void;
    onSelectedConnection: (value: string) => void;
}

export function TableManager({
    onRowsSubmit,
    onSelectedConnection,
}: TableManagerProps) {
    const { showErrorToast } = useToast();

    const [connections, setConnections] = useState<
        { label: string; value: string }[]
    >([]);
    const [selectedConnection, setSelectedConnection] = useState<string>('');
    const [tables, setTables] = useState<Array<any>>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [previewColumns, setPreviewColumns] = useState<Array<any>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [module, setModule] = useState('');
    const [action, setAction] = useState('overwrite');

    useEffect(() => {
        const getConnections = async () => {
            const connections = await window.repo.connection.findAll();
            const maps = connections.map((conn) => {
                return {
                    label: conn.name,
                    value: conn.name,
                };
            });
            setConnections(maps);
        };
        getConnections();
    }, []);

    const handleConnectionSelect = async (connectionName: string) => {
        setSelectedConnection(connectionName);
        onSelectedConnection(connectionName);

        setSelectedTable(null);
        setPreviewColumns([]);
        setIsLoading(true);

        try {
            const { success, tables, message } =
                await window.api.getTables(connectionName);
            if (success) {
                const tablesArr = tables.map((table) => {
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

    const handleChangeRows = (value) => {
        onRowsSubmit(value);
    };

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
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => {
                        row.toggleSelected(!!value);
                        handleTableSelect(row.original.tableName);
                    }}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            header: 'Data table name',
            accessorKey: 'tableName',
            cell: ({ row }) => (
                <div onClick={() => handleTableSelect(row.original.tableName)}>
                    {row.original.tableName}
                </div>
            ),
        },
        {
            header: 'Modified schema name',
            accessorKey: 'schemaName',
        },
    ];

    return (
        <>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                    <Label>Database Connections</Label>
                    <Combobox
                        value={selectedConnection}
                        name="connection"
                        onChange={handleConnectionSelect}
                        placeholder="Select a connection"
                        options={connections}
                        className="w-full"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs">
                        While matching the same shcema
                    </Label>
                    <Combobox
                        value={action}
                        name="action"
                        onChange={(value) => setAction(value)}
                        placeholder="Select a action"
                        options={actions}
                        className="w-full"
                    />
                </div>
            </div>
            <div className="flex mt-3 space-x-3">
                <div className="w-1/2 space-y-4">
                    <div className="rounded border">
                        <h4 className="p-2 text-sm">Database table</h4>
                        <Separator />
                        <ScrollArea className="h-[450px] w-full px-2">
                            {isLoading ? (
                                <div className="text-center">
                                    Loading tables...
                                </div>
                            ) : (
                                <IGRPDataTable
                                    columns={columns}
                                    data={tables}
                                    onRowSelectionChange={handleChangeRows}
                                    rowId="id"
                                />
                            )}
                        </ScrollArea>
                    </div>
                </div>
                <div className="w-1/2 space-y-3">
                    {selectedTable ? (
                        <>
                            <h3 className="text-sm text-muted-foreground">
                                Preview - {selectedTable}
                            </h3>
                            <ScrollArea className="h-[450px] w-full rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Columnn</TableHead>
                                            <TableHead>Data Type</TableHead>
                                            <TableHead>IsNullable</TableHead>
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
                                                        ? 'Yes'
                                                        : 'NO'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </>
                    ) : (
                        <div className="h-[500px] flex items-center justify-center text-muted-foreground text-sm">
                            Select a table to preview
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
