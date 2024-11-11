import AlertDialogDelete from '@renderer/components/alert-dialog-delete';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from '@renderer/components/ui/breadcrumb';
import { Button } from '@renderer/components/ui/button';
import { Separator } from '@renderer/components/ui/separator';
import { SidebarTrigger } from '@renderer/components/ui/sidebar';
import { useTranslation } from 'react-i18next';

interface ActionProps {
    onDelete: () => void;
    onCancel: () => void;
    onSubmit: () => void;
    title: string;
    isNew?: boolean
}

const FormAction = ({ onCancel, onSubmit, onDelete, title, isNew }: ActionProps) => {

    const { t } = useTranslation()

    return (
        <div className="flex flex-row h-16 shrink-0 items-center gap-2 border-b px-4">

            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />

            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="#" >
                            <span className='uppercase font-semibold text-gray-900'> {`Create New ${title}`}</span>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="ml-auto flex items-center gap-4">

                {!isNew &&
                    <AlertDialogDelete
                        recordId={title}
                        onDeleteClick={() => onDelete()} />
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