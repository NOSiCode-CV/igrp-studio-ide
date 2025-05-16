interface GenNoInfoCompProps {
    type?: string;
}
export const GenNoInfoComp = ({ type = 'COMPONENTS' }: GenNoInfoCompProps) => {
    return (
        <div className="text-xs min-h-12 flex flex-wrap md:flex-nowrap gap-x-1 items-center justify-center text-center pointer-events-none">
            <span>DROP</span>
            <span className="text-primary">
                <b>HERE</b>
            </span>
            <span className="truncate">{type}</span>
        </div>
    );
};

