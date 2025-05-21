import { useTranslation } from 'react-i18next';
interface GenNoInfoCompProps {
    type?: string;
}
const { t } = useTranslation();
export const GenNoInfoComp = ({ type = 'COMPONENTS' }: GenNoInfoCompProps) => {
    return (
      
        <div className="text-xs space-x-1 min-h-12 flex flex-1 items-center justify-center text-center">
            <span>{t('drop')}</span>
            <span className="text-primary">
                <b>{t('here')}</b>
            </span>
            <span className="truncate">{type}</span>
        </div>
    );
};

