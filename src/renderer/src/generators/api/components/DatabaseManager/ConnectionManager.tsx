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
import { Plus, Trash2, Edit } from 'lucide-react';
import { ColumnDef, IGRPDataTable } from '@igrp/igrp-framework-react-design-system';
import { ConnectionForm } from './ConnectionForm';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Connection } from 'src/main/types';
import { useTranslation } from 'react-i18next';

export function ConnectionManager({ title }: { title?: string }) {
    const { t } = useTranslation(); // Initialize translation hook
    const [connections, setConnections] = useState<Connection[]>([]);
    const [newConnection, setNewConnection] = useState<Connection>({
        name: '',
        databaseType: '',
        connectionType: 'general',
        host: '',
        port: undefined,
        user: '',
        password: '',
        database: '',
    });
    const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        const getConnections = async () => {
            const connections = await window.igrpStudio.connection.findAll();
            setConnections(connections);
        };
        getConnections();
    }, []);

    const handleAddConnection = async (values: Connection) => {
        await window.igrpStudio.connection.save(values);

        setConnections((prev) => [...prev, { ...values } as Connection]);

        setNewConnection({
            name: '',
            databaseType: '',
            connectionType: 'general',
            host: '',
            port: undefined,
            user: '',
            password: '',
            database: '',
        });
        setIsAddModalOpen(false);
    };

    const handleEditConnection = async (values: Connection) => {
        await window.igrpStudio.connection.save(values);

        setConnections((prev) =>
            prev.map((conn) =>
                conn.name === editingConnection?.name ? { ...values } : conn
            )
        );

        setEditingConnection(null);
        setIsEditModalOpen(false);
    };

    const handleDeleteConnection = async (name: string) => {
        setConnections((prev) => prev.filter((conn) => conn.name !== name));
        await window.igrpStudio.connection.delete(name);
    };

    const handleEditClick = (connection: Connection) => {
        setEditingConnection(connection);
        setIsEditModalOpen(true);
    };

    const columns: ColumnDef<Connection>[] = [
        {
            header: t('connection_name'),
            accessorKey: 'name',
        },
        {
            header: t('database_type'),
            accessorKey: 'databaseType',
        },
        {
            header: t('host'),
            accessorKey: 'host',
        },
        {
            header: t('port'),
            accessorKey: 'port',
        },
        {
            header: t('actions'),
            cell: ({ row }) => (
                <div className="flex space-x-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(row.original)}
                    >
                        <span className="sr-only">{t('edit')}</span>
                        <Edit className="h-4 w-4 " />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            handleDeleteConnection(row.original.name)
                        }
                    >
                        <span className="sr-only">{t('delete')}</span>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between">
                {title && (
                    <div>
                        <h1 className="text-3xl font-semibold">{title}</h1>
                    </div>
                )}
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4" />
                            {t('new')} {/* Use translation for button text */}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('add_new_connection')}</DialogTitle>
                            <DialogDescription>
                                {t('fill_details_to_add_connection')}
                            </DialogDescription>
                        </DialogHeader>
                        <ConnectionForm
                            connection={newConnection}
                            onSubmit={handleAddConnection}
                            onCancel={() => setIsAddModalOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Connection Dialog */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('edit_connection')}</DialogTitle>
                        <DialogDescription>
                            {t('edit_connection_description')}
                        </DialogDescription>
                    </DialogHeader>
                    {editingConnection && (
                        <ConnectionForm
                            connection={editingConnection}
                            onSubmit={handleEditConnection}
                            onCancel={() => {
                                setEditingConnection(null);
                                setIsEditModalOpen(false);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Render connections table here */}
            <ScrollArea>
                <IGRPDataTable data={connections} columns={columns} />
            </ScrollArea>
        </div>
    );
}
