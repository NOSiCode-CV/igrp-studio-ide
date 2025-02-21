import GenNoInfoField from './GenNoInfoField';

export const EmptySlotComponent = () => {
    return (
        <div className="aspect-[calc(4*3+1)/4] rounded-xl bg-muted/50 items-center justify-center flex">
            <GenNoInfoField />
        </div>
    );
};
