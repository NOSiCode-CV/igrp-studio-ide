import { Button } from '@renderer/components/ui/button';
import { DroppedComponent } from '@renderer/generators/ui/interfaces';

export interface UiButtonProps {
    componentId: string;
    comp: DroppedComponent;
    onEdit: () => void;
}

const UiButton = ({ comp}: UiButtonProps) => {
    const { label, variant, size, customClasses } = comp.config;

    return (
        <div className="relative group">
            <Button
                onClick={(e) => e.preventDefault()}
                variant={variant}
                size={size}
                className={customClasses}
            >
                <span className="truncate">{label}</span>
            </Button>
         {/*    <div className="absolute top-0 right-0 mt-1 px-2 py-1 bg-gray-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                <BoxTools id={componentId} onEdit={onEdit} />
            </div> */}
        </div>
    );
};

export default UiButton;
