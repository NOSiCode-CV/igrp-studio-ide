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
    bytea: 'binary',
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

    const handleClickSubmit = async () => {
        if (!basePath) return;

        const errorMessages: string[] = [];

        for (const key in selectedRows) {
            if (Object.hasOwn(selectedRows, key)) {
                try {
                    // Obtém a estrutura da tabela
                    const { success, message, structure } =
                        await window.api.getTableStructure(
                            selectedConnection,
                            key
                        );

                    if (success) {
                        console.log(structure);

                        // Mapeia os atributos da estrutura da tabela para o formato necessário
                        const attributes = structure.map((column) => ({
                            name: column.name || '',
                            type: typeMapping[column.data_type] || 'String', // Map types
                            length: column.max_length || null,
                            defaultValue: column.default_value || '',
                            nullable: column.is_nullable || true,
                            unique: column.is_unique || false,
                            primaryKey: column.is_primary_key || false,
                        }));

                        // Monta o objeto final para a tabela
                        const tableJson = {
                            ...initialValues,
                            tableName: key, // Nome da tabela
                            attributes,
                            name: key.charAt(0).toUpperCase() + key.slice(1), // Nome formatado
                        };

                        const values = getValuesToSubmit(
                            tableJson,
                            item.module
                        );

                        const { error } = await window.api.createModel(
                            values,
                            basePath
                        );

                        if (error) errorMessages.push(error);
                    } else {
                        console.error(
                            `Failed to fetch structure for table: ${key}. Message: ${message}`
                        );
                    }
                } catch (error) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : 'An unknown error occurred';
                    errorMessages.push(message);
                }
            }
        }

        if (errorMessages.length > 0) {
            errorMessages.forEach((errMsg) => {
                showErrorToast(errMsg);
            });
        } else {
            showSuccessToast(t('schmeacreatedSuccess'));
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
