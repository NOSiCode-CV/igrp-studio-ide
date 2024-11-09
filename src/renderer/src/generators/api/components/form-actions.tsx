import DeleteModal from '@renderer/components/DeleteModal';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from '@renderer/components/ui/breadcrumb';
import { Button } from '@renderer/components/ui/button';
import { Separator } from '@renderer/components/ui/separator';
import { SidebarTrigger } from '@renderer/components/ui/sidebar';
import { Trash } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ActionProps {
    onDelete: () => void;
    onCancel: () => void;
    onSubmit: () => void;
    title: string;
    isNew?: boolean
}

const FormAction = ({ onCancel, onSubmit, onDelete, title, isNew }: ActionProps) => {

    const [deleteModal, setDeleteModal] = useState<boolean>(false);

    const { t } = useTranslation()

    return (
        <div className="flex flex-row h-16 shrink-0 items-center gap-2 border-b px-4">

            <DeleteModal
                show={deleteModal}
                onDeleteClick={() => onDelete()}
                onCloseClick={() => setDeleteModal(false)}
            />

            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />

            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="#">
                            {`Create New ${title}`}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="ml-auto flex items-center gap-4">


                {!isNew &&
                    <Button
                        variant='link'
                        onClick={() => setDeleteModal(true)}
                        className="text-red-500"
                    >
                        <Trash />
                        {t('delete')}
                    </Button>
                }

                <Button
                    variant='outline'
                    onClick={onCancel}
                    className="border text-gray-600"
                >
                    {t('cancel')}
                </Button>

                <Button color="success" onClick={onSubmit}>
                    {t('save')}
                </Button>

            </div>
        </div>
    )
}

export default FormAction;