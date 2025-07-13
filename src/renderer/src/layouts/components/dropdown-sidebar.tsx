import React, { useState, Suspense } from 'react';
import { Plus, Ellipsis } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { MenuItem } from 'src/main/types';
import AlertDialogDelete from '@renderer/components/alert-dialog-delete';
import { ENV_TYPES, OPTION_TYPE } from '@renderer/constants/appConstants';
import useToast from '@renderer/hooks/useToast';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useGit } from '@renderer/hooks/use-git';
import { DropdownItem } from './nav-data';
import { lazy } from 'react';

// Lazy load modal components
const DatabaseManagerModal = lazy(
    () => import('@renderer/generators/api/components/DatabaseManager')
);

const SerializationConfigModal = lazy(
    () => import('@renderer/generators/api/components/serialization-config')
);

interface DropdownSidebarMenuButtonProps {
    menuItem: MenuItem;
    basePath?: string;
}

// Modal manager component
const ModalManager: React.FC<{
    modalType: string;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    item: any;
    basePath?: string;
}> = ({ modalType, isOpen, setIsOpen, item, basePath }) => {
    const renderModal = () => {
        const props = {
            item,
            basePath,
            isOpen,
            setIsOpen,
        };

        switch (modalType) {
            case 'database-manager':
                return <DatabaseManagerModal {...props} />;
            case 'serialization-config':
                return <SerializationConfigModal {...props} />;
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <Suspense fallback={<div>Loading...</div>}>
            {renderModal()}
        </Suspense>
    );
};

export const DropdownSidebarMenuButton: React.FC<
    DropdownSidebarMenuButtonProps
> = ({ menuItem, basePath }) => {
    const [modalType, setModalType] = useState<string | null>(null);
    const [modalProps, setModalProps] = useState<Record<string, any>>({});
    const [isOpen, setIsOpen] = useState(false);
    const [isOpenDelete, setIsOpenDelete] = useState(false);
    const [item, setItem] = useState<any>(null);

    const { showErrorToast, showSuccessToast } = useToast();
    const { t } = useTranslation();
    const dispatch: any = useDispatch();

    const { createGitCommit } = useGit();

    const handleDropdownClick = (item: any) => {
        setItem(item);
        if (item.actionType === OPTION_TYPE.DELETE) {
            setIsOpenDelete(true);
        } else if (item.actionType === OPTION_TYPE.DUPLICATE) {
            handleDuplicate(item);
        } else if (item.modalType) {
            setModalType(item.modalType);
            setModalProps(item || {});
            setIsOpen(true);
        } else if (item.dropdownclick) {
            item.dropdownclick(item);
        }
    };

    const handleDuplicate = async (item: any) => {
        if (!item || !basePath) return;

        try {
            const config = {
                name: item.label,
                type: item.type,
                module: item.module,
                content: item.content,
            };

            const { error } = await window.engine.duplicate(
                config,
                ENV_TYPES.SPRING,
                basePath
            );

            if (error) {
                showErrorToast(error);
            } else {
                showSuccessToast(t('duplicatedSuccess', { name: item.label }));
                createGitCommit(basePath, `Duplicate ${item.label}`);
                dispatch(onSetChangeStatus(true));
            }
        } catch (error) {
            showErrorToast(t('duplicateError', { name: item.label }));
        }
    };

    const handleDelete = async () => {
        if (!item || !basePath) return;

        const config = {
            name: item.label,
            type: item.type,
            module: item.module,
        };

        const { error } = await window.engine.delete(
            config,
            ENV_TYPES.SPRING,
            basePath
        );

        if (error) {
            showErrorToast(error);
        } else showSuccessToast(t('deletedSuccess', { name: item.label }));

        createGitCommit(basePath, `Delete ${item.label}`);

        dispatch(onSetChangeStatus(true));
    };

    const isDeleteAction = (menuItem.dropdownMenus ?? []).some(
        (menu: any) => menu.actionType === OPTION_TYPE.DELETE
    );

    return (menuItem.dropdownMenus ?? []).length === 0 ? (
        <></>
    ) : (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="text-muted-foreground hover:text-foreground">
                        {isDeleteAction ? (
                            <Ellipsis className="h-4 w-4" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    side="right"
                    align="start"
                    className="min-w-56"
                >
                    {(menuItem.dropdownMenus ?? []).map(
                        (menu: DropdownItem, idx: number) => {
                            const isDelete =
                                menu.actionType === OPTION_TYPE.DELETE;
                            return (
                                <React.Fragment key={idx}>
                                    {menu.actionType === OPTION_TYPE.DELETE && (
                                        <DropdownMenuSeparator />
                                    )}
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDropdownClick({
                                                ...menu,
                                                ...menuItem,
                                                isNew: true,
                                            });
                                        }}
                                        variant={
                                            isDelete ? 'destructive' : 'default'
                                        }
                                    >
                                        {menu.icon ? (
                                            <menu.icon className={'h-4'} />
                                        ) : (
                                            <span className="h-4 me-4"></span>
                                        )}
                                        {menu.label}
                                        {isDelete && (
                                            <DropdownMenuShortcut>
                                                ⌘+D
                                            </DropdownMenuShortcut>
                                        )}
                                    </DropdownMenuItem>
                                </React.Fragment>
                            );
                        }
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            
            {modalType && (
                <ModalManager
                    modalType={modalType}
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    item={modalProps}
                    basePath={basePath}
                />
            )}

            <AlertDialogDelete
                isOpen={isOpenDelete}
                onConfirm={handleDelete}
                onClose={(open) => {
                    setIsOpenDelete(open);
                }}
                hasTrigger={false}
            />
        </>
    );
};
