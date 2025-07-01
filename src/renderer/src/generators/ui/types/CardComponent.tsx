import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { COMPONENT_MAP, ICON_MAP } from '../ComponentTypes';
import { useFakedata } from '../hooks/useFakeData';
import { generateAllClasses } from '../components/settings/style/utils';
import { cn } from '@renderer/lib/utils';

export interface CardComponentProps {
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
    group?: string;
    hoverClass?: string;
    className?: string;
}

const CardComponent = ({
    comp,
    group,
    hoverClass,
    onDragEnd,
}: CardComponentProps) => {
    const { getFakeComponentData } = useFakedata();

    const { componentName, properties, style } = comp;

    const {
        commonProperties,
        iconProperties,
        dataProperties,
        error,
        errorMessage,
        className,
        content,
        ...args
    } = properties || {};

    const componentLabel = content || properties?.label || componentName;

    const Icon = ICON_MAP[componentName];

    const Component = COMPONENT_MAP[componentName];

    const FAKE_COMPONENT_DATA = getFakeComponentData(componentName);

    const classes = generateAllClasses(style);

    return (
        <>
            {Component ? (
                //@ts-ignore
                <Component
                    {...args}
                    {...FAKE_COMPONENT_DATA?.properties}
                    className={cn(classes, className)}
                    comp={comp}
                    onDragEnd={onDragEnd}
                    hoverClass={hoverClass}
                    group={group}
                >
                    {content || FAKE_COMPONENT_DATA?.properties?.content}
                </Component>
            ) : (
                <div className="rounded-lg shadow-xs border p-4 bg-card">
                    <div className="flex items-center gap-3 flex-wrap md:flex-nowrap justify-center">
                        {Icon && (
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-primary" />
                            </div>
                        )}
                        <div className="text-sm font-medium text-muted-foreground truncate">
                            {componentLabel}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CardComponent;
