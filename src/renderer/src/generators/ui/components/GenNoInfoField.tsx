import { useTranslation } from 'react-i18next';

const GenNoInfoField = () => {
    const { t } = useTranslation();
    return (
        <div className="text-xs space-x-1 min-h-12 flex items-center justify-center">
            <span>{t('drop')}</span>
            <span className="text-primary">
                <b>{t('fields')}</b>
            </span>
            <span>{t('or')}</span>
            <span className="text-primary">
                <b>{t('copy')}</b>
            </span>
        </div>
    );
};

export default GenNoInfoField;