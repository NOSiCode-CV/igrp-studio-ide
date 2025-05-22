interface GenNoInfoCompProps {
    type?: string;
}
export const GenNoInfoComp = ({ type = 'COMPONENTS' }: GenNoInfoCompProps) => {
    return (
        <div className="text-xs space-x-1 min-h-12 flex flex-1 items-center justify-center text-center">
            <span>DROP</span>
            <span className="text-primary">
                <b>HERE</b>
            </span>
            <span className="truncate">{type}</span>
        </div>
    );
};
