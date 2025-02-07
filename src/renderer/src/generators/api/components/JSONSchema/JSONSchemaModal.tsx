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
import { useTranslation } from 'react-i18next';
import {
    Tooltip,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { TooltipContent } from '@radix-ui/react-tooltip';

interface JSONSchemaModalProps {
    generateJSONSchema: () => string;
}

export function JSONSchemaModal({ generateJSONSchema }: JSONSchemaModalProps) {
    const { t } = useTranslation();
    const [jsonSchema, setJsonSchema] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setJsonSchema(generateJSONSchema());
        }
    }, [isOpen, generateJSONSchema]);

    return (
        <TooltipProvider>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size={'sm'}
                                className="h-6 w-6"
                            >
                                <FileJson className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{t('jsonSchemaPreview')}</TooltipContent>
                </Tooltip>
                <DialogContent className="md:max-h-[70vh] md:max-w-[700px] max-w-[800px]">
                    <DialogHeader>
                        <DialogTitle>{t('jsonSchemaPreview')}</DialogTitle>
                        <DialogDescription>
                            {t('jsonSchemaPreview')}{' '}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="my-1">
                        <pre className="p-4 rounded overflow-auto max-h-[60vh]">
                            {jsonSchema}
                        </pre>
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
