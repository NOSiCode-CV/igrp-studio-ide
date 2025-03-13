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
import { IGRPDataTable } from '@igrp/igrp-framework-react-design-system';
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

    const handleDeleteConnection = async (name: string) => {
        setConnections((prev) => prev.filter((conn) => conn.name !== name));
        await window.repo.connection.delete(name);
    };

    const columns: any[] = [
        {
            header: t('connection_name'), // Use translation for header
            accessorKey: 'name',
        },
        {
            header: t('database_type'), // Use translation for header
            accessorKey: 'databaseType',
        },
        {
            header: t('host'), // Use translation for header
            accessorKey: 'host',
        },
        {
            header: t('port'), // Use translation for header
            accessorKey: 'port',
        },
        {
            header: t('actions'), // Use translation for actions
            cell: ({ row }) => (
                <div>
                    <Button
                        variant="link"
                        onClick={() =>
                            handleDeleteConnection(row.original.name)
                        }
                    >
                        {t('delete')} {/* Use translation for button text */}
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

            {/* Render connections table here */}
            <ScrollArea>
                <IGRPDataTable data={connections} columns={columns} />
            </ScrollArea>
        </div>
    );
}
