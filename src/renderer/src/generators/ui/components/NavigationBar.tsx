
import { Button } from '@renderer/components/ui/button';
import { AppWindowMac, Braces } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NavigationBarProps {
    isDesign: boolean;
    onSwitch?: () => void;
    onSave?: () => void;
}

const NavigationBar = ({ isDesign, onSwitch, onSave }: NavigationBarProps): JSX.Element => {
    const { t } = useTranslation();

    const handleSaveClick = () => {
        if (onSave) onSave();
    };

    return (
        <div className="flex justify-end items-center space-x-2">
{/*             <Button
                color="light"
                size="sm"
                className="bg-gray-100 border border-gray-300"
                title="Preview Page"
            >
                <i className="ri-eye-fill" />
            </Button> */}
            <Button
                color={isDesign ? 'primary' : 'light'}
                size="sm"
                onClick={onSwitch}
                className="border border-gray-300"
                title={isDesign ? 'Show Code' : 'Show Design'}
            >
                {isDesign ? <AppWindowMac /> : <Braces />}
            </Button>
            <Button
                size="sm"
                className="bg-[#3AA0D9] text-white hover:bg-[#26678C]"
                onClick={handleSaveClick}
                title="Add Components to Page"
            >
                {t('save')}
            </Button>
        </div>
    );
};

export default NavigationBar;
