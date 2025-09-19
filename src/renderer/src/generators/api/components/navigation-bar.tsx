import AlertDialogDelete from '@renderer/components/alert-dialog-delete';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from '@renderer/components/ui/breadcrumb';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { Separator } from '@renderer/components/ui/separator';
import { SidebarTrigger } from '@renderer/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { AppWindowMac, Trash } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ActionProps {
    title: string;
    isNew?: boolean;
    onDelete: () => void;
    showSourceCode?: () => void;
    onClickBreadcrumbLink?: () => void;
}

const NavigationBar = ({
    onDelete,
    showSourceCode,
    onClickBreadcrumbLink,
    title,
    isNew,
}: ActionProps) => {
    const { t } = useTranslation();

    const [deleteModal, setDeleteModal] = useState<boolean>(false);

    const handleSourceCode = () => {
        showSourceCode?.();
    };

    const handleBreadcrumbLink = () => {
        onClickBreadcrumbLink?.();
    };

    return (
        <TooltipProvider>
            <div className="flex sticky top-0 bg-background h-16 shrink-0 items-center gap-2 border-b px-4 z-50">
                <AlertDialogDelete
                    isOpen={deleteModal}
                    onClose={() => setDeleteModal(false)}
                    onConfirm={onDelete}
                    hasTrigger={false}
                    recordId={title}
                />

                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                />

                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink
                                onClick={handleBreadcrumbLink}
                                className="cursor-pointer"
                            >
                                <span className="font-semibold">{title}</span>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="ml-auto flex items-center gap-4">
                    {!isNew && (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <IGRPButtonPrimitive
                                        type="button"
                                        size="sm"
                                        variant={'secondary'}
                                        onClick={handleSourceCode}
                                    >
                                        <AppWindowMac />
                                    </IGRPButtonPrimitive>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {t('sourceCode')}
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <IGRPButtonPrimitive
                                        type="button"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setDeleteModal(true);
                                        }}
                                        size={'sm'}
                                        className="outline-1 outline-destructive text-destructive"
                                    >
                                        <Trash />
                                        <span className="sr-only">
                                            {t('delete')}
                                        </span>
                                    </IGRPButtonPrimitive>
                                </TooltipTrigger>
                                <TooltipContent>{t('delete')}</TooltipContent>
                            </Tooltip>
                        </>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <IGRPButtonPrimitive color="success" type="submit">
                                {t('save')}
                            </IGRPButtonPrimitive>
                        </TooltipTrigger>
                        <TooltipContent>{t('save')}</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default NavigationBar;
