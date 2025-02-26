import {
    Type,
    FormInput,
    Calendar,
    Clock,
    Eye,
    Palette,
    FileText,
    List,
    Upload,
    CheckSquare,
    Radio,
    ToggleLeft,
    Sliders,
    Link2,
    Donut as ButtonIcon,
    Image,
    Edit3,
    Table,
    BarChart2,
    Map,
    Play,
    Fingerprint,
    Columns,
    Layout,
    CreditCard,
    Table as Tabs,
    List as ListIcon,
    Frame,
    Info,
    Calendar as CalendarIcon,
    Bell,
    Badge,
    Star,
    ChevronDown,
    Video,
    Activity,
    AlignLeft,
    GitMerge,
    MessageSquare,
    MessageCircle,
    Bell as BellIcon,
    FormInput as Form,
} from 'lucide-react';
export const COLUMN = 'column'
export const COMPONENT = 'component';
export const FIELD = 'field';
export const APP_COMPONENT = 'appcomponent';

export const COMPONENTS = {
    Containers: "Containers",
    FormElements: "FormElements",
    BasicElements: 'BasicElements',
    DataDisplay: "DataDisplay",
    LayoutWidget: "Layout",
    Widgets: "Widgets",
    Advanced: "Advanced"
}

export const Containers = {
    Form: 'Form',
    PageHeader: 'PageHeader'
}

export const BasicElements = {
    Link: 'Link',
    Button: "Button",
    Text: "Text",
    Image: "Image",
    RichTextEditor: "RichTextEditor"
}

export const DataDisplay = {
    Table: "Table",
    Charts: "Charts",
    Maps: "Maps",
    Carousel: "Carousel",
    Fingerprint: "Fingerprint"
}

export const FIELDS = {
    InputField: 'InputField',
    DatePicker: 'DatePicker',
    TimePicker: 'TimePicker',
    Password: "Password",
    Textarea: 'Textarea',
    ColorPicker: "ColorPicker",
    Select: "Select",
    Checkbox: "Checkbox",
    Radio: "Radio",
    Switch: "Switch",
    RangeSlider: "RangeSlider",
    FileUpload: "FileUpload"
}


export const LayoutWidget = {
    Box: 'Box',
    Panel: 'Panel',
    Card: 'Card',
    Tabs: 'Tabs',
    List: 'List',
    iFrame: 'iFrame',
    InfoPanel: 'InfoPanel'
};

export const Widgets = {
    Calendar: 'Calendar',
    Alerts: 'Alerts',
    Badges: 'Badges',
    Ratings: 'Ratings',
    Dropdowns: 'Dropdowns',
    EmbedVideo: 'EmbedVideo',
    Progress: 'Progress'
};


export const Advanced = {
    Accordion: 'Accordion',
    TreeView: 'TreeView',
    Chat: 'Chat',
    Modal: 'Modal',
    Notifications: 'Notifications'
};


export const ICON_MAP: Record<string, React.ElementType> = {
    InputField: FormInput,
    DatePicker: Calendar,
    TimePicker: Clock,
    Password: Eye,
    ColorPicker: Palette,
    Textarea: FileText,
    Select: List,
    Checkbox: CheckSquare,
    Radio: Radio,
    Switch: ToggleLeft,
    RangeSlider: Sliders,
    FileUpload: Upload,
    Link: Link2,
    Button: ButtonIcon,
    Text: Type,
    Image: Image,
    RichTextEditor: Edit3,
    Table: Table,
    Charts: BarChart2,
    Maps: Map,
    Carousel: Play,
    Fingerprint: Fingerprint,
    Box: Columns,
    Panel: Layout,
    Card: CreditCard,
    Tabs: Tabs,
    List: ListIcon,
    iFrame: Frame,
    InfoPanel: Info,
    Calendar: CalendarIcon,
    Alerts: Bell,
    Badges: Badge,
    Ratings: Star,
    Dropdowns: ChevronDown,
    EmbedVideo: Video,
    Progress: Activity,
    Accordion: AlignLeft,
    TreeView: GitMerge,
    Chat: MessageSquare,
    Modal: MessageCircle,
    Notifications: BellIcon,
    Form: Form,
};