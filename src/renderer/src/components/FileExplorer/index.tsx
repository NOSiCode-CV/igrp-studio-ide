import { File, Folder, ChevronRight } from 'lucide-react'; // Ícones da Lucide
import React, { useEffect, useState } from 'react';
import { FileTree } from 'src/main/types';
import {
    SidebarMenu,
    SidebarMenuSub,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@renderer/components/ui/sidebar'; // Componentes do shadcn/ui
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from '@renderer/components/ui/collapsible'; // Componentes do shadcn/ui
import { ScrollArea } from '../ui/scroll-area';

import { setCurrentItem as onSetCurrentItem } from '@renderer/redux/thunks';
import { useDispatch } from 'react-redux';
import { OPTION_TYPE } from '@renderer/constants/appConstants';

interface FileExplorerSidebarProps {
    basePath: string;
}

const FileExplorerSidebar: React.FC<FileExplorerSidebarProps> = ({
    basePath,
}) => {
    const [fileTree, setFileTree] = useState<FileTree[]>([]);

    const dispatch: any = useDispatch();

    useEffect(() => {
        const loadFileTree = async () => {
            const tree = await window.api.readDirectory(basePath);
            setFileTree(tree);
        };
        loadFileTree();
    }, [basePath]);

    const handleFileSelect = (item: FileTree) => {
        dispatch(onSetCurrentItem({ ...item, type: OPTION_TYPE.FILE_THREE, label: item.name }));
    };

    const renderTree = (tree: FileTree[]) => {
        return tree.map((item) => (
            <SidebarMenuItem key={item.path}>
                {item.isDirectory ? (
                    <Collapsible>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
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
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {item.children && renderTree(item.children)}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </Collapsible>
                ) : (
                    <SidebarMenuButton onClick={() => handleFileSelect(item)}>
                        <div className="flex items-center gap-2">
                            <File className="w-4 h-4" />
                            <span>{item.name}</span>
                        </div>
                    </SidebarMenuButton>
                )}
            </SidebarMenuItem>
        ));
    };

    return (
        <ScrollArea className="flex-1 p-2">
            <SidebarMenu>{renderTree(fileTree)}</SidebarMenu>
        </ScrollArea>
    );
};

export default FileExplorerSidebar;
