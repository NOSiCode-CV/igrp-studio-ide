import { GenNoInfoComp } from './GenNoInfoComp'
import GenNoInfoField from './GenNoInfoField'

export const EmptySlotComponent = ({ isComponent = true }: { isComponent?: boolean }) => {
    return (
        <div className="rounded-xl bg-muted/75 items-center w-full p-4">
            {isComponent ? <GenNoInfoComp /> : <GenNoInfoField />}
        </div>
    )
}
