import { Button } from '@renderer/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { Code, Eye, TvMinimal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NavigationBarProps {
    isDesign: boolean;
    onSwitch?: () => void;
    onSave?: () => void;
    basePath: string
    page: string
}

const NavigationBar = ({
    isDesign,
    onSwitch,
    onSave,
    basePath,
    page
}: NavigationBarProps) => {
    const { t } = useTranslation();

    const handleSaveClick = () => {
        onSave?.();
    };

    const handleStart = () => {
        window.electron.ipcRenderer.send('start-nextjs', basePath);
    };

    const handlePreview = () => {
        window.electron.ipcRenderer.send('open-preview', page);
    };

    const handleStop = () => {
        window.electron.ipcRenderer.send('stop-nextjs');
    };

    return (
        <div className="flex justify-end items-center space-x-2 ">
            <StudioDropdown
                onStart={handleStart}
                onPreview={handlePreview}
                onStop={handleStop}
            />
            <Button
                color={isDesign ? 'primary' : 'light'}
                size="sm"
                onClick={onSwitch}
                className="hover:bg-igrp"
                title={isDesign ? 'Show Code' : 'Show Design'}
                variant={'ghost'}
            >
                {isDesign ? <Eye /> : <Code />}
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

const StudioDropdown = ({ onStart, onPreview, onStop }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                    <TvMinimal />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={onStart}>
                    Iniciar Next.js
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPreview}>
                    Abrir Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onStop}>
                    Parar Next.js
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NavigationBar;
