import { IGRPButtonPrimitive, IGRPDropdownMenuItemPrimitive, IGRPDropdownMenuLabelPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { Ellipsis } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DropdownItemProps {
    comp: StructuredComponent;
}

export function DropDownItem({ comp }: DropdownItemProps) {
    const { children } = comp;
    const { t } = useTranslation();
    return (
        <IGRPDropdownMenuPrimitive>
            <IGRPDropdownMenuTriggerPrimitive asChild>
                <IGRPButtonPrimitive variant={'ghost'} size={'icon'}>
                    <Ellipsis />
                </IGRPButtonPrimitive>
            </IGRPDropdownMenuTriggerPrimitive>
            <IGRPDropdownMenuContentPrimitive    className="w-56">
                <IGRPDropdownMenuLabelPrimitive>{t('actions')}</IGRPDropdownMenuLabelPrimitive>
                {children.length > 0 &&
                    children.map((child) => (
                        <IGRPDropdownMenuItemPrimitive key={child.id}>
                            {child.label}
                        </IGRPDropdownMenuItemPrimitive>
                    ))}
            </IGRPDropdownMenuContentPrimitive>
        </IGRPDropdownMenuPrimitive>
    );
}
