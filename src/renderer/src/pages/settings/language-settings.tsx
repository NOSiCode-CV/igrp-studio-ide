import { Label } from '@renderer/components/ui/label';
import { useState } from 'react';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { useTranslation } from 'react-i18next';

const languages = [
    { value: 'en', label: 'English' },
    { value: 'pt', label: 'Português' },
];

export function LanguageSettings() {
    const { t, i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState<string>(
        i18n.language
    );
    const [_isPending, setIsPending] = useState<boolean>(false);

    // Atualizar o idioma dinamicamente
    const handleLanguageChange = async (newLang: string) => {
        setIsPending(true);
        try {
            // Atualizar o idioma no i18next
            await i18n.changeLanguage(newLang);

            // Salvar o novo idioma no main process (se necessário)
            await window.electron.setLanguage(newLang);

            // Atualizar o estado local
            setCurrentLanguage(newLang);
        } catch (error) {
            console.error(t('error_change_language'), error);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div>
            <div className="pb-4">
                <h2 className="text-lg font-semibold">{t('language')}</h2>
                <p className="text-sm text-muted-foreground">
                    {t('language_description')}
                </p>
            </div>
            <div className="space-y-4">
                <div className="space-y-2 flex flex-col">
                    <Label htmlFor="language">{t('language_label')}</Label>
                    <IGRPCombobox
                        value={currentLanguage}
                        options={languages}
                        onChange={handleLanguageChange}
                    />
                </div>
            </div>
        </div>
    );
}
