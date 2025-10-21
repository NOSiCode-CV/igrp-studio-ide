import {
    ColumnDef,
    IGRPAlertDialog,
    IGRPDataTable,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { getBadgeColor } from '@renderer/utils';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PageBuilderProps {
    basePath?: string;
    currentItem?: any;
    controllers?: any;
}

export type Endpoint = {
    codigoAcompanhamento: string;
};

const ControllerOverview = ({
    currentItem,
}: PageBuilderProps): React.ReactNode => {
    const { t } = useTranslation();

    const data = currentItem.content.actions;

    const handleDelete = (endpoint: Endpoint): void => {
        console.log(endpoint);
    };

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: 'actionName',
            header: t('actionName'),
        },
        {
            accessorKey: 'method',
            header: t('methodType'),
            cell: ({ row }) => {
                const method = row.getValue('method') as string;
                const color = getBadgeColor(method);
                return <span className={`${color}`}>{method}</span>;
            },
        },
        {
            accessorKey: 'path',
            header: t('path'),
        },
        {
            id: 'actions',
            header: t('actions'),
            cell: ({ row }) => {
                const endpoint: Endpoint = row.original;
                return (
                    <div className="flex space-x-2">
                        <IGRPAlertDialog
                            onAction={() => handleDelete(endpoint)}
                            title="Você tem absoluta certeza?"
                            description={`Tem certeza de que deseja remover este registro ${endpoint.codigoAcompanhamento}?`}
                        >
                            <IGRPButtonPrimitive variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-red-500" />
                                <span className="sr-only">Excluir</span>
                            </IGRPButtonPrimitive>
                        </IGRPAlertDialog>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t('Endpoints')}</h1>
            </div>
            <IGRPDataTable columns={columns} data={data} />
        </div>
    );
};

export default ControllerOverview;
