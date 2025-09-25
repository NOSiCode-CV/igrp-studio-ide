import { CodeSnippetsRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import MonacoEditor from '@renderer/components/monaco-editor';
import {
    IGRPDialogPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogTitlePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPLabel } from '@igrp/igrp-framework-react-design-system';
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
        <IGRPDialogPrimitive open={open} onOpenChange={setOpen}>
            <IGRPDialogContentPrimitive className="overflow-hidden sm:max-w-[800px] lg:max-w-[900px] max-w-[90vw] w-full">
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive>
                        {snippet?.title}
                    </IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive></IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>
                <div className="flex-1 border rounded">
                    <IGRPLabel className="block text-sm font-medium text-foreground mb-2 p-2 border-b">
                        {t('Code Snippet')}
                    </IGRPLabel>
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
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    );
};

export { SnnipetComponent };
