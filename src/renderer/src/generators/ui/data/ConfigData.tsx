import { useMemo } from 'react';
import {
    Advanced,
    BasicElements,
    COMPONENT,
    COMPONENTS,
    Containers,
    DataDisplay,
    FIELD,
    FIELDS,
    Layout,
    Widgets,
} from '../ComponentTypes';
import { Pencil, Sheet } from 'lucide-react';
import { ICON_MAP } from './ComponentRegistry';

const useConfigdata = () => {
    const menuItems: any = useMemo(
        () => [
            {
                id: COMPONENTS.Containers,
                label: 'Conatiners',
                type: COMPONENT,
                subItems: [
                    {
                        id: Containers.FORM,
                        label: 'Form',
                        icon: Sheet,
                        type: COMPONENTS.Containers,
                    },
                ],
            },
            {
                id: COMPONENTS.FormElements,
                label: 'Form Elements',
                icon: Pencil,
                type: FIELD,
                subItems: [
                    {
                        id: FIELDS.InputInput,
                        label: 'Input Field',
                        icon: ICON_MAP[FIELDS.InputInput],
                    },
                    {
                        id: FIELDS.DatePicker,
                        label: 'Date Picker',
                        icon: ICON_MAP[FIELDS.DatePicker],
                    },
                    {
                        id: FIELDS.TimePicker,
                        label: 'Time Picker',
                        icon: ICON_MAP[FIELDS.TimePicker],
                    },
                    {
                        id: FIELDS.Password,
                        label: 'Password',
                        icon: ICON_MAP[FIELDS.Password],
                    },
                    {
                        id: FIELDS.Textarea,
                        label: 'Textarea',
                        icon: ICON_MAP[FIELDS.Textarea],
                    },
                    {
                        id: FIELDS.ColorPicker,
                        label: 'Color Picker',
                        icon: ICON_MAP[FIELDS.ColorPicker],
                    },
                    {
                        id: FIELDS.Select,
                        label: 'Select',
                        icon: ICON_MAP[FIELDS.Select],
                    },
                    {
                        id: FIELDS.Checkbox,
                        label: 'Checkbox',
                        icon: ICON_MAP[FIELDS.Checkbox],
                    },
                    {
                        id: FIELDS.Radio,
                        label: 'Radio',
                        icon: ICON_MAP[FIELDS.Radio],
                    },
                    {
                        id: FIELDS.Switch,
                        label: 'Switch',
                        icon: ICON_MAP[FIELDS.Switch],
                    },
                    {
                        id: FIELDS.RangeSlider,
                        label: 'Range Slider',
                        icon: ICON_MAP[FIELDS.RangeSlider],
                    },
                    {
                        id: FIELDS.FileUpload,
                        label: 'File Upload',
                        icon: ICON_MAP[FIELDS.FileUpload],
                    },
                ],
            },
            {
                id: COMPONENTS.BasicElements,
                label: 'Basic Elements',
                type: COMPONENT,
                subItems: [
                    {
                        id: BasicElements.Link,
                        label: 'Link',
                        icon: ICON_MAP[BasicElements.Link],
                    },
                    {
                        id: BasicElements.Button,
                        label: 'Button',
                        icon: ICON_MAP[BasicElements.Button],
                    },
                    {
                        id: BasicElements.Text,
                        label: 'Text',
                        icon: ICON_MAP[BasicElements.Button],
                    },
                    {
                        id: BasicElements.Image,
                        label: 'Image',
                        icon: ICON_MAP[BasicElements.Image],
                    },
                    {
                        id: BasicElements.RichTextEditor,
                        label: 'Rich Text Editor',
                        icon: ICON_MAP[BasicElements.RichTextEditor],
                    },
                ],
            },
            {
                id: COMPONENTS.DataDisplay,
                label: 'Data Display',
                type: COMPONENT,
                subItems: [
                    {
                        id: DataDisplay.Table,
                        label: 'Table',
                        icon: ICON_MAP[DataDisplay.Table],
                    },
                    {
                        id: DataDisplay.Charts,
                        label: 'Charts',
                        icon: ICON_MAP[DataDisplay.Charts],
                    },
                    {
                        id: DataDisplay.Maps,
                        label: 'Maps',
                        icon: ICON_MAP[DataDisplay.Maps],
                    },
                    {
                        id: DataDisplay.Carousel,
                        label: 'Carousel',
                        icon: ICON_MAP[DataDisplay.Carousel],
                    },
                    {
                        id: DataDisplay.Fingerprint,
                        label: 'Fingerprint',
                        icon: ICON_MAP[DataDisplay.Fingerprint],
                    },
                ],
            },
            {
                id: COMPONENTS.Layout,
                label: 'Layout',
                type: COMPONENT,
                subItems: [
                    {
                        id: Layout.Box,
                        label: 'Box',
                        icon: ICON_MAP[Layout.Box],
                    },
                    {
                        id: Layout.Panel,
                        label: 'Panel',
                        icon: ICON_MAP[Layout.Panel],
                    },
                    {
                        id: Layout.Card,
                        label: 'Card',
                        icon: ICON_MAP[Layout.Card],
                    },
                    {
                        id: Layout.Tabs,
                        label: 'Tabs',
                        icon: ICON_MAP[Layout.Tabs],
                    },
                    {
                        id: Layout.List,
                        label: 'List',
                        icon: ICON_MAP[Layout.List],
                    },
                    {
                        id: Layout.iFrame,
                        label: 'iFrame',
                        icon: ICON_MAP[Layout.iFrame],
                    },
                    {
                        id: Layout.InfoPanel,
                        label: 'Info Panel',
                        icon: ICON_MAP[Layout.InfoPanel],
                    },
                ],
            },
            {
                id: COMPONENTS.Widgets,
                label: 'Widgets',
                type: COMPONENT,
                subItems: [
                    {
                        id: Widgets.Calendar,
                        label: 'Calendar',
                        icon: ICON_MAP[Widgets.Calendar],
                    },
                    {
                        id: Widgets.Alerts,
                        label: 'Alerts',
                        icon: ICON_MAP[Widgets.Alerts],
                    },
                    {
                        id: Widgets.Badges,
                        label: 'Badges',
                        icon: ICON_MAP[Widgets.Badges],
                    },
                    {
                        id: Widgets.Ratings,
                        label: 'Ratings',
                        icon: ICON_MAP[Widgets.Ratings],
                    },
                    {
                        id: Widgets.Dropdowns,
                        label: 'Dropdowns',
                        icon: ICON_MAP[Widgets.Dropdowns],
                    },
                    {
                        id: Widgets.EmbedVideo,
                        label: 'Embed Video',
                        icon: ICON_MAP[Widgets.EmbedVideo],
                    },
                    {
                        id: Widgets.Progress,
                        label: 'Progress',
                        icon: ICON_MAP[Widgets.Progress],
                    },
                ],
            },
            {
                id: COMPONENTS.Advanced,
                label: 'Advanced',
                type: COMPONENT,
                subItems: [
                    {
                        id: Advanced.Accordion,
                        label: 'Accordion',
                        icon: ICON_MAP[Advanced.Accordion],
                    },
                    {
                        id: Advanced.TreeView,
                        label: 'Tree View',
                        icon: ICON_MAP[Advanced.TreeView],
                    },
                    {
                        id: Advanced.Chat,
                        label: 'Chat',
                        icon: ICON_MAP[Advanced.Chat],
                    },
                    {
                        id: Advanced.Modal,
                        label: 'Modal',
                        icon: ICON_MAP[Advanced.Modal],
                    },
                    {
                        id: Advanced.Notifications,
                        label: 'Notifications',
                        icon: ICON_MAP[Advanced.Notifications],
                    },
                ],
            },
        ],
        []
    );

    return { menuItems };
};
export { useConfigdata };
