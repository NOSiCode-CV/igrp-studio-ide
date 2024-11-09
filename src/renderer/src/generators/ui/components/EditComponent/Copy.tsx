import Select from "react-select";
import { FormGroup, Label } from "reactstrap";

const Copy = () => {

    const pages = [];

    return (
        <FormGroup>
            <Label htmlFor="pages" className="form-label fw-medium fs-13">From Page</Label>
            <Select
                id="database"
                options={pages}
            />
        </FormGroup>
    )
}

export default Copy;