import React from 'react';
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

interface DatabaseManagerModalProps {
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
}

const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
    isOpen = false,
    setIsOpen,
}) => {
    const handleClickSubmit = () => {
        console.log('Ok');
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
                        <TableManager />
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
