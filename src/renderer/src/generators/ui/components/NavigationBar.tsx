
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
            <Button
                color={isDesign ? 'primary' : 'light'}
                size="sm"
                onClick={onSwitch}
                className="hover:bg-igrp"
                title={isDesign ? 'Show Code' : 'Show Design'}
            >
                {isDesign ? <AppWindowMac /> : <Braces />}
            </Button>
            <Button
                size="sm"
                className="bg-igrp"
                onClick={handleSaveClick}
                title="Add Components to Page"
            >
                {t('save')}
            </Button>
        </div>
    );
};

export default NavigationBar;
