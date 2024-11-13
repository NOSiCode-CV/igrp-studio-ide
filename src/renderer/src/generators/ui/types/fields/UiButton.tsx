import BoxTools from "../tools/RowTools";
import { Link } from "react-router-dom";
import { DroppedComponent } from "../../interfaces";

export interface UiButtonProps {
    componentId: string;
    comp: DroppedComponent;
    onEdit: () => void;
}

const UiButton = ({ componentId, comp, onEdit }: UiButtonProps) => {
    const { label } = comp.config;

    return (
        <div className="relative group">
            <Link
                type="button"
                className="gen-ctx-menu-holder bg-primary text-white py-2 px-4 rounded hover:opacity-75 focus:outline-none flex items-center"
                to="/#"
                onClick={(e) => e.preventDefault()}
            >
                <span className="truncate">{label}</span>
            </Link>
            <div className="absolute top-0 right-0 mt-1 px-2 py-1 bg-gray-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                <BoxTools id={componentId} onEdit={onEdit} />
            </div>
        </div>
    );
};

export default UiButton;
