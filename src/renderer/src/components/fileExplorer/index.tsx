import { File, Folder, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { FileTree } from 'src/main/types';
import {
    IGRPSidebarMenuPrimitive,
    IGRPSidebarMenuSubPrimitive,
    IGRPSidebarMenuItemPrimitive,
    IGRPSidebarMenuButtonPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import {
    IGRPCollapsiblePrimitive,
    IGRPCollapsibleTriggerPrimitive,
    IGRPCollapsibleContentPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPScrollAreaPrimitive } from '@igrp/igrp-framework-react-design-system';

import { setCurrentItem as onSetCurrentItem } from '@renderer/redux/thunks';
import { useDispatch, useSelector } from 'react-redux';
import { OPTION_TYPE } from '@renderer/constants/appConstants';
import { createSelector } from 'reselect';

interface FileExplorerSidebarProps {
    basePath: string;
    searchTerm: string;
}

const FileExplorerSidebar: React.FC<FileExplorerSidebarProps> = ({
    basePath,
    searchTerm,
}) => {
    const [fileTree, setFileTree] = useState<FileTree[]>([]);

    const dispatch: any = useDispatch();

    const selectStudioState = (state: any) => state.PageBuilder;
    const selectStudioProperties = createSelector(
        selectStudioState,
        (studio) => ({
            changeStatus: studio.changeStatus,
        })
    );

    const { changeStatus } = useSelector(selectStudioProperties);

    useEffect(() => {
        const loadFileTree = async () => {
            const tree = await window.api.readDirectory(basePath);
            setFileTree(tree);
        };
        loadFileTree();
    }, [basePath, changeStatus]);

    const handleFileSelect = (item: FileTree) => {
        dispatch(
            onSetCurrentItem({
                ...item,
                type: OPTION_TYPE.FILE_THREE,
                label: item.name,
            })
        );
    };

    const filterTree = (tree: FileTree[], term: string): FileTree[] => {
        return tree.filter((item) => {
            if (item.name.toLowerCase().includes(term.toLowerCase())) {
                return true;
            }
            if (item.children) {
                item.children = filterTree(item.children, term);
                return item.children.length > 0;
            }
            return false;
        });
    };

    const renderTree = (tree: FileTree[]) => {
        const filteredTree = searchTerm ? filterTree(tree, searchTerm) : tree;
        return filteredTree.map((item) => (
            <IGRPSidebarMenuItemPrimitive key={item.path}>
                {item.isDirectory ? (
                    <IGRPCollapsiblePrimitive>
                        <IGRPCollapsibleTriggerPrimitive asChild>
                            <IGRPSidebarMenuButtonPrimitive
                                className="justify-between"
                                onClick={() => {
                                    if (!item.isDirectory) {
                                        handleFileSelect(item);
                                    }
                                }}
                            >
                                <div className="flex items-center space-x-2">
                                    {item.isDirectory && (
                                        <ChevronRight className="w-4 h-4 transition-transform transform group-data-[state=open]/collapsible:rotate-90" />
                                    )}
                                    <Folder className="w-4 h-4" />
                                    {/* Ícone de pasta */}
                                    <span>{item.name}</span>
                                </div>
                            </IGRPSidebarMenuButtonPrimitive>
                        </IGRPCollapsibleTriggerPrimitive>
                        <IGRPCollapsibleContentPrimitive>
                            <IGRPSidebarMenuSubPrimitive>
                                {item.children && renderTree(item.children)}
                            </IGRPSidebarMenuSubPrimitive>
                        </IGRPCollapsibleContentPrimitive>
                    </IGRPCollapsiblePrimitive>
                ) : (
                    <IGRPSidebarMenuButtonPrimitive
                        onClick={() => handleFileSelect(item)}
                    >
                        <div className="flex items-center gap-2">
                            <File className="w-4 h-4" />
                            <span>{item.name}</span>
                        </div>
                    </IGRPSidebarMenuButtonPrimitive>
                )}
            </IGRPSidebarMenuItemPrimitive>
        ));
    };

    return (
        <IGRPScrollAreaPrimitive className="flex-1 p-2 overflow-auto">
            <IGRPSidebarMenuPrimitive>
                {renderTree(fileTree)}
            </IGRPSidebarMenuPrimitive>
        </IGRPScrollAreaPrimitive>
    );
};

export default FileExplorerSidebar;
