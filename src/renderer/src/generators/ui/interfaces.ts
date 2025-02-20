import { Type, FormInput, Calendar, Clock, Eye, Palette, FileText, List, Upload, CheckSquare, Radio, ToggleLeft, Sliders, Link2, Donut as ButtonIcon, Image, Edit3, FileUp, Table, BarChart2, Map, Play, Fingerprint, Columns, Layout, CreditCard, Table as Tabs, List as ListIcon, Frame, Info, Calendar as CalendarIcon, Bell, Badge, Star, ChevronDown, Video, Activity, AlignLeft, GitMerge, MessageSquare, MessageCircle, Bell as BellIcon, GripHorizontal, Plus, Grid, Settings, Trash2, Copy, MoveHorizontal, LayoutGrid, Minus, ChevronLeft, ChevronRight, Square, Columns as ColumnsIcon, FormInput as Form } from 'lucide-react';

export interface DroppedComponent {
    id: string; // ID único para o componente dropado
    [key: string]: any;    
}

export interface Column {
    id: string; // ID da coluna
    colSize: number;
    components: DroppedComponent[] | []; // Componentes dropados na coluna
}

export interface HierarchicalComponent {
    id: string; // ID da linha (row)
    columns: Column[]; // Lista de colunas nessa linha
}


const ICON_MAP: Record<string, React.ElementType> = {
    'Input Field': FormInput,
    'Date Picker': Calendar,
    'Time Picker': Clock,
    'Password': Eye,
    'Color Picker': Palette,
    'Textarea': FileText,
    'Select': List,
    'Checkbox': CheckSquare,
    'Radio': Radio,
    'Switch': ToggleLeft,
    'Range Slider': Sliders,
    'File Upload': Upload,
    'Link': Link2,
    'Button': ButtonIcon,
    'Text': Type,
    'Image': Image,
    'Rich Text Editor': Edit3,
    'Table': Table,
    'Charts': BarChart2,
    'Maps': Map,
    'Carousel': Play,
    'Fingerprint': Fingerprint,
    'Box': Columns,
    'Panel': Layout,
    'Card': CreditCard,
    'Tabs': Tabs,
    'List': ListIcon,
    'iFrame': Frame,
    'Info Panel': Info,
    'Calendar': CalendarIcon,
    'Alerts': Bell,
    'Badges': Badge,
    'Ratings': Star,
    'Dropdowns': ChevronDown,
    'Embed Video': Video,
    'Progress': Activity,
    'Accordion': AlignLeft,
    'Tree View': GitMerge,
    'Chat': MessageSquare,
    'Modal': MessageCircle,
    'Notifications': BellIcon,
    'Form': Form
  };