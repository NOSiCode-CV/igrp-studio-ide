import { StructuredComponent } from '@renderer/lib/dnd/types';
import { AddField } from '../../components/add-fields';

interface RowOptionsProps {
    onEdit: () => void;
    comp: StructuredComponent;
    parentComp: StructuredComponent;
}

const TableTool = ({ comp, parentComp }: RowOptionsProps) => {
    return (
        <div id="table-tools">
            {/* Action buttons */}
            <div className="absolute px-3 z-10 right-4 rounded opacity-0 group-hover/table:opacity-100 transition-opacity duration-200 bg-gray-600 text-white">
                <AddField comp={comp} parentComp={parentComp} />
            </div>
        </div>
    );
};

export default TableTool;
