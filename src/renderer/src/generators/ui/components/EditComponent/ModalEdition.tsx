import { useEffect, useState } from "react";
import { Button, Col, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
import { useDroppedComponents } from "../../dnd/DroppedComponentsContext";
import { DroppedComponent } from "../../interfaces";
import classnames from "classnames";
import { Link } from "react-router-dom";
import Copy from "./Copy";
import FieldContainer from "./FieldContainer";
import { useTranslation } from "react-i18next";
import RenderPropsConfig from "./RenderPropsConfig";
import useConfigComponent from "./useConfigComponent";

interface ModalEditionProps {
    show: boolean;
    onConfirmClick?: () => void;
    onCloseClick?: () => void;
}

const navItems = [
    { id: "properties", label: "Properties" },
    { id: "2", label: "Fields" },
    { id: "3", label: "Annotations" },
    { id: "4", label: "Copy" }
];

const ModalEdition = ({ show, onConfirmClick, onCloseClick }: ModalEditionProps) => {

    const { t } = useTranslation();

    const [editionModal, setEditionModal] = useState<boolean>(show);

    const [arrowNavTab, setarrowNavTab] = useState<string>("properties");
    
    const arrowNavToggle = (tab: any) => {
        if (arrowNavTab !== tab) {
            setarrowNavTab(tab);
        }
    };

    const { currentComponent, updateComponent, clearEditingComponent } = useDroppedComponents();

    if (!currentComponent) {
        return null;
    }

    const { componentName, id, config, fields } = currentComponent;

    const propsConfig = useConfigComponent(componentName);

    const [identif, setIdentif] = useState(id || '');

    const handleConfirm = () => {

        const updatedConfig = { ...config, ...formValues };

        const updatedComponent: Partial<DroppedComponent> = {
            ...currentComponent,
            id: identif,
            config: updatedConfig
        };

        if (currentComponent.id !== undefined)
            updateComponent(currentComponent.id, updatedComponent);

        if (onConfirmClick) onConfirmClick();
        clearEditingComponent();
        setEditionModal(false)
    };

    const handleClose = () => {
        if (onCloseClick) onCloseClick();
        clearEditingComponent();
        setEditionModal(false)
    }

    const closeBtn = (
        <button className="close btn-close text-white align-items-center" onClick={(handleClose)} type="button"> {/* &times; */}</button>
    );

    const initialFormValues = propsConfig && Object.keys(propsConfig).reduce((acc, key) => {
        acc[key] = propsConfig[key].defaultValue ?? config[key] ?? '';
        return acc;
    }, {});

    const [formValues, setFormValues] = useState(initialFormValues);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setFormValues((prevValues) => ({
            ...prevValues,
            [name]: newValue,
        }));
    };

    return (
        <Modal
            isOpen={editionModal}
            toggle={handleClose}
            backdrop="static"
            fade={false}
            size='lg'
            id="gen-edition-modal"
        >
            <ModalHeader className="bg-primary text-light py-3 align-items-center" toggle={onCloseClick} close={closeBtn}>
                <span className="text-light">{t('settings')}</span>
            </ModalHeader>

            <ModalBody className="p-0 pb-5">
                <Nav pills className="nav nav-pills nav-primary opacity-75 bg-light mb-3">
                    {navItems.map((item) => (
                        <NavItem key={item.id}>
                            <NavLink
                                style={{ cursor: "pointer", borderRadius: 0 }}
                                className={classnames({ active: arrowNavTab === item.id })}
                                onClick={() => arrowNavToggle(item.id)}
                                id={item.id}
                            >
                                {t(item.label)}
                            </NavLink>
                        </NavItem>
                    ))}

                </Nav>

                <TabContent
                    activeTab={arrowNavTab}
                    className="text-muted"
                >
                    <TabPane tabId="properties" id="arrow-properties" className="px-3">

                        <Form role="form">
                            <Row className='gy-3 group-fields'>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label for="identif">{t('identifier')}</Label>
                                        <Input
                                            type="text"
                                            id="identif"
                                            value={identif}
                                            onChange={(e) => setIdentif(e.target.value)}
                                            placeholder="Enter component Identify"
                                            required
                                        />
                                    </FormGroup>
                                </Col>

                                {propsConfig && <RenderPropsConfig propsConfig={propsConfig}
                                    formValues={formValues}
                                    handleInputChange={handleInputChange}
                                />}

                            </Row>
                        </Form>

                    </TabPane>
                    <TabPane tabId="2" id="arrow-fields">
                        <FieldContainer componentName={componentName} componentId={currentComponent.id} fields={fields} />
                    </TabPane>
                    <TabPane tabId="3" id="arrow-annotation" className="px-3 pb-5">

                        <h6>Contact</h6>
                        <p className="mb-0">
                            Consistency is the one thing that can take all of the different elements in your design, and tie them all together and make them work. In an awareness campaign, it is vital for people to begin put 2 and 2 together and begin to recognize your cause. Consistency piques people’s interest is that it has become more and more popular over the years, which is excellent news to the beginner and advanced <Link to="#" className="text-decoration-underline"><b>Contact Designer</b></Link>.
                        </p>
                    </TabPane>
                    <TabPane tabId="4" id="arrow-copy" className="px-3 pb-5">
                        <Copy />
                    </TabPane>
                </TabContent>
            </ModalBody>
            <ModalFooter className={`d-flex align-items-center justify-content-between ${arrowNavTab === "properties" ? '' : 'd-none'}`}>
                <div className="float-start justify-content-start">
                    <span className="info object d-none"></span>
                    <span className="info type d-flex align-items-center">{` `}{componentName}</span>
                </div>
            </ModalFooter>
            <Button data-toggle="tooltip" type="button" color="primary"
                className="waves-effect waves-light" id="gen-edit-confirm"
                onClick={handleConfirm}>
                <i className="ri ri-save-line"></i>
            </Button>
        </Modal>
    )
}

export default ModalEdition