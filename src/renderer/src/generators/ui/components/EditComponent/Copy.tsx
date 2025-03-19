import { IGRPCombobox } from "@igrp/igrp-framework-react-design-system";
import { Label } from "@renderer/components/ui/label";

const Copy = () => {

    const pages = [];

    const handleChange = () => {

    }

    return (
        <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pages" className="">From Page</Label>
                <IGRPCombobox
                    options={pages}
                    onChange={handleChange}
                    className="col-span-3"
                />
            </div>
        </div>
    )
}

export default Copy;