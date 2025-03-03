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
    ICON_MAP,
    LayoutWidget,
    STRUCTURE,
    STRUCTURES,
    Widgets,
} from '../ComponentTypes';
import { Columns, Grid, PanelTopIcon, Pencil, Sheet } from 'lucide-react';

const useConfigdata = () => {
    const menuItems: any = useMemo(
        () => [
            {
                id: COMPONENTS.Structures,
                label: 'Structure',
                type: STRUCTURE,
                subItems: [
                    {
                        id: STRUCTURES.Columns,
                        label: 'Columns',
                        icon: Columns
                    },
                    {
                        id: STRUCTURES.Grid,
                        label: 'Grid',
                        icon: Grid,
                    }
                ],
            },
            {
                id: COMPONENTS.Containers,
                label: 'Containers',
                subItems: [
                    {
                        id: Containers.Form,
                        label: 'Form',
                        icon: Sheet,
                        type: COMPONENT
                    },
                    {
                        id: Containers.PageHeader,
                        label: 'Page Header',
                        icon: PanelTopIcon,
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
                        id: FIELDS.InputField,
                        label: 'Input Field',
                        icon: ICON_MAP[FIELDS.InputField],
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
                id: COMPONENTS.LayoutWidget,
                label: 'Layout',
                subItems: [
                    {
                        id: LayoutWidget.Box,
                        label: 'Box',
                        icon: ICON_MAP[LayoutWidget.Box],
                    },
                    {
                        id: LayoutWidget.Panel,
                        label: 'Panel',
                        icon: ICON_MAP[LayoutWidget.Panel],
                    },
                    {
                        id: LayoutWidget.Card,
                        label: 'Card',
                        icon: ICON_MAP[LayoutWidget.Card],
                    },
                    {
                        id: LayoutWidget.Tabs,
                        label: 'Tabs',
                        icon: ICON_MAP[LayoutWidget.Tabs],
                    },
                    {
                        id: LayoutWidget.List,
                        label: 'List',
                        icon: ICON_MAP[LayoutWidget.List],
                    },
                    {
                        id: LayoutWidget.iFrame,
                        label: 'iFrame',
                        icon: ICON_MAP[LayoutWidget.iFrame],
                    },
                    {
                        id: LayoutWidget.InfoPanel,
                        label: 'Info Panel',
                        icon: ICON_MAP[LayoutWidget.InfoPanel],
                    },
                ],
            },
            {
                id: COMPONENTS.Widgets,
                label: 'Widgets',
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
