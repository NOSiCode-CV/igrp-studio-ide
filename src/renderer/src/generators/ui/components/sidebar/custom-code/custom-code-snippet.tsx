import { CodeSnippetsRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import MonacoEditor from '@renderer/components/monaco-editor';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import { Label } from '@renderer/components/ui/label';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
interface SnippetComponentProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    snippet: CodeSnippetsRegisterConfig | null;
}

const SnnipetComponent = ({
    open,
    setOpen,
    snippet,
}: SnippetComponentProps) => {
    const { t } = useTranslation();
    const importRef = useRef<string>('');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-hidden sm:max-w-[800px] lg:max-w-[900px] max-w-[90vw] w-full">
                <DialogHeader>
                    <DialogTitle>{snippet?.title}</DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>
                <div className="flex-1 border rounded">
                    <Label className="block text-sm font-medium text-foreground mb-2 p-2 border-b">
                        {t('Code Snippet')}
                    </Label>
                    <MonacoEditor
                        content={snippet?.code || ''}
                        filePath=""
                        onChange={(newCode) => {
                            importRef.current = newCode;
                        }}
                        height="30vh"
                        language="typescript"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export { SnnipetComponent };
