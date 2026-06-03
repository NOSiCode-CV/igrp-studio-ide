/**
 * Shared map of IGRP component name → lucide icon.
 *
 * Keys are the string identifiers the engine emits (matching the `COMPONENT`
 * enum's *values* in `generators/ui/ComponentTypes.ts`). Decoupling the keys
 * from that enum keeps this module independent of the UI generator — anyone
 * holding a `componentName: string` (the Prototype palette, the API generator,
 * future surfaces) can look up the right icon without depending on
 * `generators/ui`.
 */

import {
    Activity,
    AlignLeft,
    AreaChart,
    Badge,
    BarChart2,
    Bell,
    Bell as BellIcon,
    Donut as ButtonIcon,
    Calendar,
    CalendarDays,
    Calendar as CalendarIcon,
    CaseSensitive,
    ChartBarBig,
    ChartColumnBig,
    CheckCircle,
    CheckSquare,
    ChevronDown,
    ChevronsUpDown,
    CircleDot,
    CircleUser,
    Clock,
    Code,
    Columns2,
    Copy,
    CreditCard,
    DollarSign,
    Dot,
    Edit3,
    Ellipsis,
    Eye,
    EyeOff,
    FileText,
    Fingerprint,
    FormInput as Form,
    FormInput,
    Frame,
    Gauge,
    GitMerge,
    Grid,
    Hash,
    Heading,
    Heading1,
    Heart,
    Image,
    Info,
    Layout,
    LayoutList,
    LineChart,
    Link2,
    List,
    ListCollapse,
    List as ListIcon,
    Map,
    Menu,
    MessageCircle,
    MoveRight,
    Palette,
    Phone,
    PieChart,
    Play,
    RadarIcon,
    Ratio,
    RectangleHorizontal,
    Search,
    SeparatorHorizontal,
    Sliders,
    Square,
    SquareMousePointer,
    Star,
    Table,
    Table2,
    Table as Tabs,
    Text,
    TextCursorInput,
    Text as TextIcon,
    ToggleLeft,
    TrendingUp,
    Upload,
    Video,
    WrapText
} from 'lucide-react'
import type React from 'react'

/**
 * `componentName` → icon. The key set tracks the `COMPONENT` enum *values*
 * in `generators/ui/ComponentTypes.ts`; when that enum grows, mirror new
 * entries here. Unknown names fall back to a generic icon via
 * `resolveIcon()`.
 */
export const ICON_MAP: Record<string, React.ElementType> = {
    input: TextCursorInput,
    inputText: TextCursorInput,
    inputAddOn: FormInput,
    inputNumber: Hash,
    label: CaseSensitive,
    inputHidden: EyeOff,
    datePicker: Calendar,
    inputDatePicker: Calendar,
    inputTime: Clock,
    inputPassword: Eye,
    inputColor: Palette,
    inputTextarea: AlignLeft,
    inputPhone: Phone,
    inputFile: Upload,
    select: ChevronsUpDown,
    combobox: List,
    checkbox: CheckSquare,
    radio: CircleDot,
    switch: ToggleLeft,
    slider: Sliders,
    inputUrl: Link2,
    button: SquareMousePointer,
    text: Text,
    image: Image,
    richTextEditor: Edit3,
    table: Table,
    chart: BarChart2,
    maps: Map,
    carousel: Play,
    fingerprint: Fingerprint,
    datePickerRange: Calendar,

    panel: Layout,
    card: CreditCard,
    tabs: Tabs,
    list: ListIcon,
    iFrame: Frame,
    infoPanel: Info,
    alerts: Bell,
    badge: Badge,
    ratings: Star,
    videoEmbed: Video,
    progress: Activity,
    calendarSingle: CalendarDays,
    calendarSingleTime: CalendarDays,
    calendarRange: CalendarDays,
    calendarRangeTime: CalendarDays,
    calendarMultiple: CalendarDays,
    calendarMultipleTime: CalendarDays,
    datePickerSingle: Calendar,
    datePickerMultiple: Calendar,
    inputDatePickerSingle: Calendar,

    form: Form,
    container: Square,
    grid: Grid,
    flex: MoveRight,
    columns: Columns2,
    column: Columns2,
    headline: Heading1,
    dropdown: Ellipsis,
    icon: Heart,

    piechart: PieChart,
    areachart: AreaChart,
    linechart: LineChart,
    horizontalBarchart: ChartBarBig,
    verticalBarchart: ChartColumnBig,
    radialBarchart: Gauge,
    radarchart: RadarIcon,

    chat: MessageCircle,
    inputSearch: Search,
    statsCard: TrendingUp,
    separator: SeparatorHorizontal,
    modalDialog: CheckCircle,
    alertDialog: Info,
    aspect: Ratio,
    menuNavigation: Menu,
    alert: Dot,

    pageHeader: Heading,
    fragment: Code,
    paragraph: WrapText,
    textList: WrapText,
    repetitiveList: LayoutList,
    formList: LayoutList,
    infoCard: CreditCard,
    pdfViewer: FileText,
    statusBanner: Bell,

    span: TextIcon,
    section: RectangleHorizontal,

    treeView: GitMerge,

    notifications: BellIcon,

    stack: Table2,

    tableDateFilter: CalendarIcon,
    tableTextFilter: FormInput,
    tableNumberFilter: Sliders,
    tableCheckboxFilter: CheckSquare,
    tableSelectFilter: List,
    tableActionListCell: ButtonIcon,
    tableAmountCell: DollarSign,
    tableCheckboxCell: CheckSquare,
    tableDateCell: CalendarIcon,
    tableTextCell: FormInput,
    tableExpanderCell: ChevronDown,
    tableBadgeCell: Badge,
    copyTo: Copy,
    avatar: CircleUser,
    // `accordion` previously mapped twice; ListCollapse wins (last-write).
    accordion: ListCollapse,
    cardDetails: ListCollapse
} as const

/**
 * Fallback icon used when a component name is not registered above.
 * Picked to look distinctly "generic" so missing entries are easy to spot
 * during development.
 */
const FALLBACK_ICON: React.ElementType = Square

/** Resolve an icon by component name, with a sensible default for unknowns. */
export const resolveIcon = (componentName: string | undefined | null): React.ElementType => {
    if (!componentName) return FALLBACK_ICON
    return ICON_MAP[componentName] ?? FALLBACK_ICON
}
