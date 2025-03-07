import { useMemo } from 'react';
import {
    ADVANCED,
    BASIC_ELEMENTS,
    COMPONENT,
    COMPONENTS,
    CONTAINERS,
    DATA_DISPLAY,
    FIELD,
    FORM_ELEMENTS,
    ICON_MAP,
    LAYOUT_WIDGET,
    STRUCTURE,
    STRUCTURES,
    WIDGETS,
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
                        id: CONTAINERS.Form,
                        label: 'Form',
                        icon: Sheet,
                        type: COMPONENT
                    },
                    {
                        id: CONTAINERS.PageHeader,
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
                        id: FORM_ELEMENTS.InputField,
                        label: 'Input Field',
                        icon: ICON_MAP[FORM_ELEMENTS.InputField],
                    },
                    {
                        id: FORM_ELEMENTS.DatePicker,
                        label: 'Date Picker',
                        icon: ICON_MAP[FORM_ELEMENTS.DatePicker],
                    },
                    {
                        id: FORM_ELEMENTS.TimePicker,
                        label: 'Time Picker',
                        icon: ICON_MAP[FORM_ELEMENTS.TimePicker],
                    },
                    {    
                        id: FORM_ELEMENTS.Password,
                        label: 'Password',
                        icon: ICON_MAP[FORM_ELEMENTS.Password],
                    },
                    {
                        id: FORM_ELEMENTS.Textarea,
                        label: 'Textarea',
                        icon: ICON_MAP[FORM_ELEMENTS.Textarea],
                    },
                    {
                        id: FORM_ELEMENTS.ColorPicker,
                        label: 'Color Picker',
                        icon: ICON_MAP[FORM_ELEMENTS.ColorPicker],
                    },
                    {
                        id: FORM_ELEMENTS.Select,
                        label: 'Select',
                        icon: ICON_MAP[FORM_ELEMENTS.Select],
                    },
                    {
                        id: FORM_ELEMENTS.Checkbox,
                        label: 'Checkbox',
                        icon: ICON_MAP[FORM_ELEMENTS.Checkbox],
                    },
                    {
                        id: FORM_ELEMENTS.Radio,
                        label: 'Radio',
                        icon: ICON_MAP[FORM_ELEMENTS.Radio],
                    },
                    {
                        id: FORM_ELEMENTS.Switch,
                        label: 'Switch',
                        icon: ICON_MAP[FORM_ELEMENTS.Switch],
                    },
                    {
                        id: FORM_ELEMENTS.RangeSlider,
                        label: 'Range Slider',
                        icon: ICON_MAP[FORM_ELEMENTS.RangeSlider],
                    },
                    {
                        id: FORM_ELEMENTS.FileUpload,
                        label: 'File Upload',
                        icon: ICON_MAP[FORM_ELEMENTS.FileUpload],
                    },
                ],
            },
            {
                id: COMPONENTS.BasicElements,
                label: 'Basic Elements',
                subItems: [
                    {
                        id: BASIC_ELEMENTS.Link,
                        label: 'Link',
                        icon: ICON_MAP[BASIC_ELEMENTS.Link],
                    },
                    {
                        id: BASIC_ELEMENTS.Button,
                        label: 'Button',
                        icon: ICON_MAP[BASIC_ELEMENTS.Button],
                    },
                    {
                        id: BASIC_ELEMENTS.Text,
                        label: 'Text',
                        icon: ICON_MAP[BASIC_ELEMENTS.Button],
                    },
                    {
                        id: BASIC_ELEMENTS.Image,
                        label: 'Image',
                        icon: ICON_MAP[BASIC_ELEMENTS.Image],
                    },
                    {
                        id: BASIC_ELEMENTS.RichTextEditor,
                        label: 'Rich Text Editor',
                        icon: ICON_MAP[BASIC_ELEMENTS.RichTextEditor],
                    },
                ],
            },
            {
                id: COMPONENTS.DataDisplay,
                label: 'Data Display',
                subItems: [
                    {
                        id: DATA_DISPLAY.Table,
                        label: 'Table',
                        icon: ICON_MAP[DATA_DISPLAY.Table],
                    },
                    {
                        id: DATA_DISPLAY.Charts,
                        label: 'Charts',
                        icon: ICON_MAP[DATA_DISPLAY.Charts],
                    },
                    {
                        id: DATA_DISPLAY.Maps,
                        label: 'Maps',
                        icon: ICON_MAP[DATA_DISPLAY.Maps],
                    },
                    {
                        id: DATA_DISPLAY.Carousel,
                        label: 'Carousel',
                        icon: ICON_MAP[DATA_DISPLAY.Carousel],
                    },
                    {
                        id: DATA_DISPLAY.Fingerprint,
                        label: 'Fingerprint',
                        icon: ICON_MAP[DATA_DISPLAY.Fingerprint],
                    },
                ],
            },
            {
                id: COMPONENTS.LayoutWidget,
                label: 'Layout',
                subItems: [
                    {
                        id: LAYOUT_WIDGET.Box,
                        label: 'Box',
                        icon: ICON_MAP[LAYOUT_WIDGET.Box],
                    },
                    {
                        id: LAYOUT_WIDGET.Panel,
                        label: 'Panel',
                        icon: ICON_MAP[LAYOUT_WIDGET.Panel],
                    },
                    {
                        id: LAYOUT_WIDGET.Card,
                        label: 'Card',
                        icon: ICON_MAP[LAYOUT_WIDGET.Card],
                    },
                    {
                        id: LAYOUT_WIDGET.Tabs,
                        label: 'Tabs',
                        icon: ICON_MAP[LAYOUT_WIDGET.Tabs],
                    },
                    {
                        id: LAYOUT_WIDGET.List,
                        label: 'List',
                        icon: ICON_MAP[LAYOUT_WIDGET.List],
                    },
                    {
                        id: LAYOUT_WIDGET.iFrame,
                        label: 'iFrame',
                        icon: ICON_MAP[LAYOUT_WIDGET.iFrame],
                    },
                    {
                        id: LAYOUT_WIDGET.InfoPanel,
                        label: 'Info Panel',
                        icon: ICON_MAP[LAYOUT_WIDGET.InfoPanel],
                    },
                ],
            },
            {
                id: COMPONENTS.Widgets,
                label: 'Widgets',
                subItems: [
                    {
                        id: WIDGETS.Calendar,
                        label: 'Calendar',
                        icon: ICON_MAP[WIDGETS.Calendar],
                    },
                    {
                        id: WIDGETS.Alerts,
                        label: 'Alerts',
                        icon: ICON_MAP[WIDGETS.Alerts],
                    },
                    {
                        id: WIDGETS.Badges,
                        label: 'Badges',
                        icon: ICON_MAP[WIDGETS.Badges],
                    },
                    {
                        id: WIDGETS.Ratings,
                        label: 'Ratings',
                        icon: ICON_MAP[WIDGETS.Ratings],
                    },
                    {
                        id: WIDGETS.Dropdowns,
                        label: 'Dropdowns',
                        icon: ICON_MAP[WIDGETS.Dropdowns],
                    },
                    {
                        id: WIDGETS.EmbedVideo,
                        label: 'Embed Video',
                        icon: ICON_MAP[WIDGETS.EmbedVideo],
                    },
                    {
                        id: WIDGETS.Progress,
                        label: 'Progress',
                        icon: ICON_MAP[WIDGETS.Progress],
                    },
                ],
            },
            {
                id: COMPONENTS.Advanced,
                label: 'Advanced',
                subItems: [
                    {
                        id: ADVANCED.Accordion,
                        label: 'Accordion',
                        icon: ICON_MAP[ADVANCED.Accordion],
                    },
                    {
                        id: ADVANCED.TreeView,
                        label: 'Tree View',
                        icon: ICON_MAP[ADVANCED.TreeView],
                    },
                    {
                        id: ADVANCED.Chat,
                        label: 'Chat',
                        icon: ICON_MAP[ADVANCED.Chat],
                    },
                    {
                        id: ADVANCED.Modal,
                        label: 'Modal',
                        icon: ICON_MAP[ADVANCED.Modal],
                    },
                    {
                        id: ADVANCED.Notifications,
                        label: 'Notifications',
                        icon: ICON_MAP[ADVANCED.Notifications],
                    },
                ],
            },
        ],
        []
    );

    return { menuItems };
};
export { useConfigdata };
