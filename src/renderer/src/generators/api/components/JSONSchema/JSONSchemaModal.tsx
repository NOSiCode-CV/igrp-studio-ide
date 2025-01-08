import { useState, useEffect } from 'react';
import { Button } from '@renderer/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@renderer/components/ui/dialog';
import { FileJson } from 'lucide-react';

interface JSONSchemaModalProps {
    generateJSONSchema: () => string;
}

export function JSONSchemaModal({ generateJSONSchema }: JSONSchemaModalProps) {
    const [jsonSchema, setJsonSchema] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setJsonSchema(generateJSONSchema());
        }
    }, [isOpen, generateJSONSchema]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size={'sm'}
                    title="Preview JSON Schema"
                    className="h-6 w-6"
                >
                    <FileJson className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="md:max-h-[70vh] md:max-w-[700px] max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>JSON Schema Preview</DialogTitle>
                    <DialogDescription>
                        This is a preview of your generated JSON schema.
                    </DialogDescription>
                </DialogHeader>
                <div className="my-1">
                    <pre className="p-4 bg-gray-100 rounded overflow-auto max-h-[60vh]">
                        {jsonSchema}
                    </pre>
                </div>
            </DialogContent>
        </Dialog>
    );
}
