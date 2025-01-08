import { useEffect, useState } from 'react';
import { Button } from '@renderer/components/ui/button';
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
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import { Separator } from '@renderer/components/ui/separator';
import { ColumnDef } from '@igrp/igrp-design-system/dist/types';
import { Checkbox } from '@renderer/components/ui/checkbox';

export type Database = {
    id: string;
    tableName: string;
};

export function TableManager() {
    const { showErrorToast } = useToast();

    const [connections, setConnections] = useState<
        { label: string; value: string }[]
    >([]);
    const [selectedConnection, setSelectedConnection] = useState<string>('');
    const [tables, setTables] = useState<Array<any>>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [previewColumns, setPreviewColumns] = useState<Array<any>>([]);
    const [isLoading, setIsLoading] = useState(false);

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
                    };
                });
                setTables(tablesArr);
            }

            if (message) showErrorToast(message);
        } catch (error) {
            console.error('Error fetching tables:', error);
            // Here you might want to show an error message to the user
        } finally {
            setIsLoading(false);
        }
    };

    const handleTableSelect = async (table: string) => {
        setSelectedTable(table);
        const { success, message, structure } =
            await window.api.getTableStructure(selectedConnection, table);
        if (!success) showErrorToast(message);
        console.log(structure);
        setPreviewColumns(structure);
    };

    const handleChangeRows = (value) => {
        console.log(value);
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
                    onCheckedChange={(value) => {row.toggleSelected(!!value);  handleTableSelect(row.original.tableName)}}
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
    ];

    return (
        <div className="flex mt-3 space-x-3">
            <div className="w-1/2 space-y-4">
                <div className="w-full flex flex-1 space-x-2">
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
                <Card className="rounded-sm">
                    <CardHeader className="p-3">
                        <CardTitle>Database table</CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent>
                        <ScrollArea className="h-[450px] w-full">
                            {isLoading ? (
                                <div className="text-center">
                                    Loading tables...
                                </div>
                            ) : (
                                <IGRPDataTable
                                    columns={columns}
                                    data={tables}
                                    onRowSelectionChange={handleChangeRows}
                                    rowId='id'
                                />
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            <div className="w-1/2">
                {selectedTable ? (
                    <div>
                        <h3 className="text-lg font-semibold mb-2">
                            Table Preview: {selectedTable}
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
                                                {column?.is_nullable}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                ) : (
                    <div className="h-[500px] flex items-center justify-center text-gray-500">
                        Select a table to preview
                    </div>
                )}
            </div>
        </div>
    );
}
