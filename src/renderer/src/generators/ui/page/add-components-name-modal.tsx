import React, { useState, useEffect } from 'react';
import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { Plus } from 'lucide-react';
import {
    SelectInput,
    TextInput,
} from '@renderer/generators/api/components/inputs-form';
import { useTranslation } from 'react-i18next';
import { FileTree } from 'src/main/types';

interface AddComponentsNameModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (
        componentDescription: string,
        componentName: string,
        previousComponent: any
    ) => void;
    defaultComponentName: string;
    defaultName?: string;
    processFound: FileTree | undefined;
}

export const AddComponentsNameModal: React.FC<AddComponentsNameModalProps> = ({
    open,
    onOpenChange,
    onConfirm,
    defaultComponentName,
    defaultName = '',
    processFound,
}) => {
    const [description, setDescription] = useState(defaultName);
    const [componentName, setComponentName] = useState(defaultComponentName);
    const [previousComponent, setPreviousComponent] = useState(null);
    const [availableVersions, setAvailableVersions] = useState<
        Array<{ label: string; value: string }>
    >([]);
    const [availableComponents, setAvailableComponents] = useState<
        Array<{ label: string; value: string }>
    >([]);

    const { t } = useTranslation();

    useEffect(() => {
        if (processFound) {
            const versions = processFound.children?.map((child) => ({
                label: child.name,
                value: child.name,
            }));
            setAvailableVersions(versions || []);
        }
    }, [processFound]);

    useEffect(() => {
        if (open) {
            setDescription(defaultName);
            setComponentName(defaultComponentName);
            setPreviousComponent(null);
        }
    }, [open, defaultName, defaultComponentName]);

    const handleConfirm = () => {
        if (!description.trim() || !componentName.trim()) return;

        onConfirm(description.trim(), componentName.trim(), previousComponent);
        onOpenChange(false);
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    const hasAvailableVersions = availableVersions.length > 0;

    const handleVersionChange = async (version: string) => {
        const components = processFound?.children
            ?.find((child) => child.name === version)
            ?.children?.map((child) => ({
                label: child.content.description || child.content.name,
                value: child.content,
            }));

        setAvailableComponents(components || []);
    };

    const handleComponentChange = (component: any) => {
        setPreviousComponent(component);
    };

    return (
        <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
            <IGRPDialogContentPrimitive>
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Configure New Step
                    </IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                        Configure the new step name and optionally copy from an
                        existing version.
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>

                <div className="space-y-6 py-4">
                    <TextInput
                        id="description"
                        label={t('Step Name')}
                        onChange={(e) => setDescription(e.target.value)}
                        value={description || ''}
                        placeholder="Enter step name..."
                        isRequired
                    />
                    <TextInput
                        id="name"
                        label={t('Step Key')}
                        className="col-span-3"
                        onChange={(e) => setComponentName(e.target.value)}
                        value={componentName || ''}
                        placeholder="Step key"
                        isRequired
                    />

                    {/* Copy from Previous Version */}
                    {hasAvailableVersions && (
                        <div className="space-y-4">
                            <p className="text-sm font-medium">
                                Copy from previous version
                            </p>
                            <SelectInput
                                id="version-select"
                                label="Available Versions"
                                options={availableVersions}
                                onChange={(value) =>
                                    handleVersionChange(value as string)
                                }
                                placeholder="Choose a version..."
                            />
                            <SelectInput
                                id="component-select"
                                label="Components"
                                options={availableComponents}
                                onChange={(value) =>
                                    handleComponentChange(value as any)
                                }
                                placeholder="Choose a component..."
                            />
                        </div>
                    )}
                </div>

                <IGRPDialogFooterPrimitive className="gap-2">
                    <IGRPButtonPrimitive
                        variant="outline"
                        onClick={handleCancel}
                    >
                        Cancel
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive
                        onClick={handleConfirm}
                        disabled={!description.trim() || !componentName.trim()}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        {previousComponent ? 'Copy Step' : 'Generate Step'}
                    </IGRPButtonPrimitive>
                </IGRPDialogFooterPrimitive>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    );
};
