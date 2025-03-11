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
    Square,
    Grid,
    Columns2,
    Table2,
    RectangleHorizontal,
    SlidersHorizontal,
    ChartPie,
} from 'lucide-react';

// Constants
export const COLUMN = 'column';
export const COMPONENT = 'component';
export const FIELD = 'field';
export const APP_COMPONENT = 'appComponent';
export const STRUCTURE = 'structure';

// Component Categories
export const GROUP_COMPONET: Record<string, string> = {
    structure: "Structure",
    containers: "Containers",
    formElements: "Form Elements",
    basicElements: "Basic Elements",
    dataDisplay: "Data Display",
    layout: "Layout",
    widget: "Widgets",
    advanced: "Advanced"
};

// Structures
export const STRUCTURES = {
    Columns: "columns",
    Column: "column",
    Grid: "grid",
    Section: "section",
    Container: 'container'
};

// Containers
export const CONTAINERS = {
    Form: 'form',
    PageHeader: 'pageHeader'
};

// Basic Elements
export const BASIC_ELEMENTS = {
    Link: 'link',
    Button: "button",
    Text: "text",
    Image: "image",
    RichTextEditor: "richTextEditor"
};

// Data Display
export const DATA_DISPLAY = {
    Table: "table",
    Charts: "charts",
    Maps: "maps",
    Carousel: "carousel",
    Fingerprint: "fingerprint"
};

// Fields
export const FORM_ELEMENTS = {
    InputField: 'input',
    DatePicker: 'datePicker',
    TimePicker: 'timePicker',
    Password: "password",
    Textarea: 'textarea',
    ColorPicker: "colorPicker",
    Select: "select",
    Checkbox: "checkbox",
    Radio: "radio",
    Switch: "switch",
    RangeSlider: "rangeSlider",
    FileUpload: "fileUpload"
};

// Layout Widgets
export const LAYOUT_WIDGET = {
    Box: 'box',
    Panel: 'panel',
    Card: 'card',
    Tabs: 'tabs',
    List: 'list',
    iFrame: 'iFrame',
    InfoPanel: 'infoPanel'
};

// Widgets
export const WIDGETS = {
    Calendar: 'calendar',
    Alerts: 'alerts',
    Badges: 'badges',
    Ratings: 'ratings',
    Dropdowns: 'dropdowns',
    EmbedVideo: 'embedVideo',
    Progress: 'progress'
};

// Advanced Components
export const ADVANCED = {
    Accordion: 'accordion',
    TreeView: 'treeView',
    Chat: 'chat',
    Modal: 'modal',
    Notifications: 'notifications'
};

// Icon Mapping
export const ICON_MAP: Record<string, React.ElementType> = {
    input: FormInput,
    datePicker: Calendar,
    timePicker: Clock,
    password: Eye,
    colorPicker: Palette,
    textarea: FileText,
    select: List,
    checkbox: CheckSquare,
    radio: Radio,
    switch: ToggleLeft,
    rangeSlider: Sliders,
    fileUpload: Upload,
    link: Link2,
    button: ButtonIcon,
    text: Type, // Updated to lowercase
    image: Image,
    richTextEditor: Edit3,
    table: Table,
    charts: BarChart2,
    maps: Map,
    carousel: Play,
    fingerprint: Fingerprint,
    box: Columns,
    panel: Layout,
    card: CreditCard,
    tabs: Tabs,
    list: ListIcon,
    iFrame: Frame,
    infoPanel: Info,
    calendar: CalendarIcon,
    alerts: Bell,
    badges: Badge,
    ratings: Star,
    dropdowns: ChevronDown,
    embedVideo: Video,
    progress: Activity,
    accordion: AlignLeft,
    treeView: GitMerge,
    chat: MessageSquare,
    modal: MessageCircle,
    notifications: BellIcon,
    form: Form,
    container: Square,
    grid: Grid,
    columns: Columns2,
    column: Columns2,
    stack: Table2,
    section: RectangleHorizontal,
    slider: SlidersHorizontal,
    chart: ChartPie
};