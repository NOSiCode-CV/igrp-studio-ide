import { useEffect, useState } from 'react';
import { Button } from '@renderer/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@renderer/components/ui/dialog';
import { Plus } from 'lucide-react';
import { IGRPDataTable } from '@igrp/igrp-design-system';
import { ColumnDef } from '@igrp/igrp-design-system/dist/types';
import { ConnectionForm } from './ConnectionForm';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Connection } from 'src/main/types';

export function ConnectionManager() {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [newConnection, setNewConnection] = useState<Connection>({
        name: '',
        databaseType: '',
        connectionType: 'general',
        host: '',
        port: null,
        user: '',
        password: '',
        database: '',
    });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        const getConnections = async () => {
            const connections = await window.repo.connection.findAll();
            setConnections(connections);
        };
        getConnections();
    }, []);

    const handleAddConnection = async (values: Connection) => {

        await window.repo.connection.save(values);

        setConnections((prev) => [...prev, { ...values } as Connection]);

        setNewConnection({
            name: '',
            databaseType: '',
            connectionType: 'general',
            host: '',
            port: null,
            user: '',
            password: '',
            database: '',
        });
        setIsAddModalOpen(false);
    };

    const handleDeleteConnection = async(name: string) => {
        setConnections((prev) => prev.filter((conn) => conn.name !== name));
        await window.repo.connection.delete(name);
    };

    const columns: ColumnDef<Connection>[] = [
        {
            header: 'Connection Name',
            accessorKey: 'name',
        },
        {
            header: 'Database Type',
            accessorKey: 'databaseType',
        },
        {
            header: 'Host',
            accessorKey: 'host',
        },
        {
            header: 'Port',
            accessorKey: 'port',
        },
        {
            header: 'Actions',
            cell: ({ row }) => (
                <div>
                    <Button
                        variant="link"
                        onClick={() =>
                            handleDeleteConnection(row.original.name)
                        }
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="h-4" />
                        New
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Connection</DialogTitle>
                        <DialogDescription>
                            Fill out the details to add a new database
                            connection.
                        </DialogDescription>
                    </DialogHeader>
                    <ConnectionForm
                        connection={newConnection}
                        onSubmit={handleAddConnection}
                        onCancel={() => setIsAddModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Render connections table here */}
            <ScrollArea>
                <IGRPDataTable
                    data={connections}
                    columns={columns}
                />
            </ScrollArea>
        </div>
    );
}
