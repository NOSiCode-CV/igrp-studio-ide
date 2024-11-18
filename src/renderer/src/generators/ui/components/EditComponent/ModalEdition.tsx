import { useState } from "react";
import { useDroppedComponents } from "../../dnd/DroppedComponentsContext";
import { DroppedComponent } from "../../interfaces";
import { Link } from "react-router-dom";
import Copy from "./Copy";
import FieldContainer from "./FieldContainer";
import { useTranslation } from "react-i18next";
import RenderPropsConfig from "./RenderPropsConfig";
import useConfigComponent from "./useConfigComponent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/tabs";
import { Button } from "@renderer/components/ui/button";
import { Save } from "lucide-react";
import { Label } from "@renderer/components/ui/label";
import { Input } from "@renderer/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@renderer/components/ui/dialog"

interface ModalEditionProps {
    show: boolean;
    onConfirmClick?: () => void;
    onCloseClick?: () => void;
}

const navItems = [
    { id: "properties", label: "Properties" },
    { id: "fields", label: "Fields" },
    { id: "annotations", label: "Annotations" },
    { id: "copy", label: "Copy" }
];

const ModalEdition = ({ show, onConfirmClick, onCloseClick }: ModalEditionProps) => {

    const { t } = useTranslation();

    const [editionModal, setEditionModal] = useState<boolean>(show);

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
        <Dialog open={editionModal} onOpenChange={handleClose}>
            <DialogContent className="md:max-h-[680px] md:max-w-[700px] lg:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>{t('settings')}</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <Tabs defaultValue="properties">
                        <TabsList className="grid w-full grid-cols-4">
                            {navItems.map((item) => (
                                <TabsTrigger value={item.id} key={item.id}>
                                    {t(item.label)}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value="properties">
                            <form role="form">
                                <div className="grid gap-4">
                                    <div className="flex flex-col space-y-3">
                                        <Label htmlFor="identif">{t('identifier')}</Label>
                                        <Input
                                            type="text"
                                            id="identif"
                                            value={identif}
                                            onChange={(e) => setIdentif(e.target.value)}
                                            placeholder="Enter component Identify"
                                            required
                                            className="col-span-3"
                                        />
                                    </div>

                                    {propsConfig && (
                                        <div className="grip grip-col-6 gap-4">
                                            <RenderPropsConfig
                                                propsConfig={propsConfig}
                                                formValues={formValues}
                                                handleInputChange={handleInputChange}
                                            />
                                        </div>
                                    )}
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="fields">
                            <FieldContainer componentName={componentName} componentId={currentComponent.id} fields={fields} />
                        </TabsContent>

                        <TabsContent value="annotation">
                            <h6>Contact</h6>
                            <p className="mb-0">
                                Consistency is the one thing that can take all of the different elements in your design and tie
                                them together. In an awareness campaign, it is vital for people to recognize your cause.
                                Consistency piques people’s interest as it becomes popular, which benefits both beginners and
                                advanced designers. <Link to="#" className="underline font-semibold">Contact Designer</Link>.
                            </p>
                        </TabsContent>

                        <TabsContent value="copy">
                            <Copy />
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter
                    className={`flex items-center justify-between`}
                >
                    <div className="flex justify-start">
                        <span className="info hidden"></span>
                        <span className="info flex items-center">{` `}{componentName}</span>
                    </div>

                    <Button
                        type="button"
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
                        id="gen-edit-confirm"
                        onClick={handleConfirm}
                    >
                        <Save />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    )
}

export default ModalEdition