import React, { useState } from 'react';
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
import useToast from '@renderer/components/useToast';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { dropdownItem } from './nav-data';
import { useGit } from '@renderer/hooks/useGit';

interface DropdownSidebarMenuButtonProps {
    menuItem: MenuItem;
    basePath?: string;
}

export const DropdownSidebarMenuButton: React.FC<
    DropdownSidebarMenuButtonProps
> = ({ menuItem, basePath }) => {
    const [activeComponent, setActiveComponent] =
        useState<React.ReactNode | null>(null);

    const [modalProps, setModalProps] = useState<Record<string, any>>({});
    const [isOpen, setIsOpen] = useState(false);
    const [isOpenDelete, setIsOpenDelete] = useState(false);
    const [item, setItem] = useState<any>(null);

    const { showErrorToast, showSuccessToast } = useToast();
    const { t } = useTranslation();
    const dispatch: any = useDispatch();

    const {createGitCommit} =useGit()

    const handleDropdownClick = (item: any) => {
        setItem(item);
        if (item.actionType === OPTION_TYPE.DELETE) {
            setIsOpenDelete(true);
        } else if (item.componentName) {
            setActiveComponent(item.componentName);
            setModalProps(item || {});
            setIsOpen(true);
        } else if (item.dropdownclick) {
            item.dropdownclick(item);
        }
    };
    if (!menuItem.dropdownMenus?.length) return;

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

    const isDeleteAction = menuItem.dropdownMenus.some(
        (menu) => menu.actionType === OPTION_TYPE.DELETE
    );

    return (
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
                    className="min-w-56 rounded-lg"
                >
                    {menuItem.dropdownMenus.map(
                        (menu: dropdownItem, idx: number) => {
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
                                        className="cursor-pointer"
                                    >
                                        {menu.icon ? (
                                            <menu.icon className={'h-4'} />
                                        ) : (
                                            <span className="h-4 me-4"></span>
                                        )}
                                        {menu.label}
                                        {menu.actionType ===
                                            OPTION_TYPE.DELETE && (
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
            {/* Render the selected component */}
            {activeComponent && (
                <div className="modal-container">
                    {React.cloneElement(activeComponent as React.ReactElement, {
                        item: modalProps,
                        basePath: basePath,
                        isOpen,
                        setIsOpen,
                    })}
                </div>
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
