import { useState, useEffect } from 'react';
import { IGRPButtonPrimitive, IGRPDialogContentPrimitive, IGRPDialogDescriptionPrimitive, IGRPDialogHeaderPrimitive, IGRPDialogTriggerPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { FileJson } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    IGRPTooltipPrimitive,
    IGRPTooltipTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPTooltipContentPrimitive } from '@igrp/igrp-framework-react-design-system';

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
        <IGRPDialogPrimitive open={isOpen} onOpenChange={setIsOpen}>
            <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive asChild>
                    <IGRPDialogTriggerPrimitive asChild>
                        <IGRPButtonPrimitive variant="ghost" size={'sm'} className="h-6 w-6">
                            <FileJson className="h-4 w-4" />
                        </IGRPButtonPrimitive>
                    </IGRPDialogTriggerPrimitive>
                </IGRPTooltipTriggerPrimitive>
                <IGRPTooltipContentPrimitive>{t('jsonSchemaPreview')}</IGRPTooltipContentPrimitive>
            </IGRPTooltipPrimitive>
            <IGRPDialogContentPrimitive className="md:max-h-[70vh] md:max-w-[700px] max-w-[800px]">
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive>{t('jsonSchemaPreview')}</IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                        {t('jsonSchemaPreview')}
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>
                <div className="my-1">
                    <pre className="p-4 rounded overflow-auto max-h-[60vh]">
                        {jsonSchema}
                    </pre>
                </div>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    );
}
