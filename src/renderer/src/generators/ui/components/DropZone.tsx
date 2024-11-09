/* import classNames from "classnames";
import { useDrop } from "react-dnd";

export interface DropZoneDataProps {
	index: number,
	acceptTypes: Array<string>
}

interface DropZoneProps {
	data: DropZoneDataProps,
	isLast?: boolean,
	className?: string,
	onDrop: (data: DropZoneDataProps, item: any) => void
}

const DropZone = ({ data, isLast, onDrop, className }: DropZoneProps) => {

	const [{ isOver, canDrop }, drop] = useDrop({
		accept: data.acceptTypes,
		drop: (item: any) => {
			onDrop(data, item);
		},
		canDrop: (item, monitor) => {
			return true;
		},
		collect: (monitor) => ({
			isOver: !!monitor.isOver(),
			canDrop: monitor.canDrop()
		}),
	});

	const isActive = isOver && canDrop;

	return (
		<div className={classNames(
			"drop-zone",
			className,
			{ active: isActive, isLast },
			{ 'visible-zone': isOver || canDrop }
		)}
			ref={drop}>
			{isOver ? 'Release to drop' : ''}
		</div>
	);
};
export default DropZone;
 */