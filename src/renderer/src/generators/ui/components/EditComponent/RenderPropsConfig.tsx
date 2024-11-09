import { Col, FormGroup, Label, Input } from 'reactstrap';
import Select from "react-select";

const RenderPropsConfig = ({ propsConfig, formValues, handleInputChange }) => {
 
    return Object.keys(propsConfig).map((key) => {
       
        const config = propsConfig[key]; 

        return (
            <Col md={6} key={key}>
                <FormGroup>
                    <Label for={key}>{config.label}</Label>
                    {(() => {
                        switch (config.type) {
                            case 'boolean':
                                return (
                                    <div className="form-check form-switch form-switch-md" dir="ltr">
                                        <Input
                                            type="checkbox"
                                            name={key}
                                            checked={formValues[key] ?? config.defaultValue}
                                            onChange={handleInputChange}
                                            className='form-check-input'
                                        />
                                    </div>
                                );
                            case 'select':
                                return (
                                    <Select
                                        type="select"
                                        name={key}
                                        value={formValues[key] ?? config.defaultValue}
                                        onChange={handleInputChange}
                                        options={config.options}
                                    >
                                    </Select>
                                );
                            case 'text':
                            default:
                                return (
                                    <Input
                                        type="text"
                                        name={key}
                                        value={formValues[key] ?? config.defaultValue}
                                        onChange={handleInputChange}
                                    />
                                );
                        }
                    })()}
                </FormGroup>
            </Col>
        );
    });
};

export default RenderPropsConfig;
