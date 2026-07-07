import {
    IGRPAlertDialog,
    IGRPAreaChart,
    IGRPAvatar,
    IGRPBadge,
    IGRPButton,
    IGRPCalendarMultiple,
    IGRPCalendarMultipleTime,
    IGRPCalendarRange,
    IGRPCalendarRangeTime,
    IGRPCalendarSingle,
    IGRPCalendarSingleTime,
    IGRPChat,
    IGRPCheckbox,
    IGRPCombobox,
    IGRPCommand,
    IGRPCopyTo,
    IGRPDataTableFilterDropdown,
    IGRPDataTableFilterFaceted,
    IGRPDataTableFilterInput,
    IGRPDataTableFilterMinMax,
    IGRPDataTableFilterSelect,
    IGRPDatePickerInputSingle,
    IGRPDatePickerMultiple,
    IGRPDatePickerRange,
    IGRPDatePickerSingle,
    IGRPDateTimeInput,
    IGRPHeadline,
    IGRPHorizontalBarChart,
    IGRPIcon,
    IGRPImage,
    IGRPInputAddOn,
    IGRPInputColor,
    IGRPInputFile,
    IGRPInputHidden,
    IGRPInputNumber,
    IGRPInputPassword,
    IGRPInputPhone,
    IGRPInputSearch,
    IGRPInputText,
    IGRPInputTime,
    IGRPInputUrl,
    IGRPLabel,
    IGRPLineChart,
    IGRPLoadingSpinner,
    IGRPNotification,
    IGRPPageHeaderBackButton,
    IGRPPdfViewer,
    IGRPPieChart,
    IGRPRadarChart,
    IGRPRadialBarChart,
    IGRPRadioGroup,
    IGRPSelect,
    IGRPSeparator,
    IGRPStatsCard,
    IGRPStatsCardMini,
    IGRPStatsCardTopBorderColored,
    IGRPStatusBanner,
    // Unprefixed (shadcn-style) design-system exports, aliased for clarity.
    FieldDescription as IGRPStudioFieldDescription,
    Kbd as IGRPStudioKbd,
    // `progress` is exported unprefixed (shadcn-style) in the design-system.
    Progress as IGRPStudioProgress,
    Skeleton as IGRPStudioSkeleton,
    Toggle as IGRPStudioToggle,
    IGRPSwitch,
    IGRPText,
    IGRPTextarea,
    IGRPToaster,
    IGRPUserAvatar,
    IGRPVerticalBarChart,
    IGRPVideoEmbed
} from '@igrp/igrp-framework-react-design-system'
// Lucide imports for ICON_MAP moved to `@renderer/features/component-icons`.
import IGRPStudioAccordion from './renderers/components/Accordion'
import IGRPStudioAlert from './renderers/components/Alert'
import IGRPStudioCard from './renderers/components/Card'
import IGRPStudioCardDetails from './renderers/components/CardDetails'
import IGRPStudioColumn from './renderers/components/Column'
import IGRPStudioColumns from './renderers/components/Columns'
import IGRPStudioContainer from './renderers/components/Container'
import IGRPStudioDropdown from './renderers/components/Dropdown'
import {
    IGRPStudioAspectRatioContainer,
    IGRPStudioScrollAreaContainer
} from './renderers/components/DroppableShells'
import IGRPStudioFlex from './renderers/components/Flex'
import IGRPStudioForm from './renderers/components/Form'
import IGRPStudioFormList from './renderers/components/FormList'
import IGRPStudioFragment from './renderers/components/Fragment'
import IGRPStudioGrid from './renderers/components/Grid'
import IGRPStudioInfoCard from './renderers/components/InfoCard'
import IGRPStudioPage from './renderers/components/MainComponent'
import IGRPStudioMenubar from './renderers/components/Menubar'
import IGRPStudioMenuNavigation from './renderers/components/MenuNavigation'
import {
    IGRPSTudioDialogFooter,
    IGRPSTudioDialogHeader,
    IGRPSTudioDialogTitle,
    IGRPStudioDialogDescription,
    IGRPStudioDialogTrigger,
    IGRPStudioModalDialog
} from './renderers/components/ModalDialog'
import {
    IGRPStudioDrawer,
    IGRPStudioHoverCard,
    IGRPStudioPopover,
    IGRPStudioSheet,
    IGRPStudioTooltip
} from './renderers/components/OverlayPreviews'
import IGRPStudioPageHeader from './renderers/components/PageHeader'
import IGRPStudioParagraph from './renderers/components/Paragraph'
import IGRPStudioRepetitive from './renderers/components/RepetitiveList'
import IGRPStudioSection from './renderers/components/Section'
import {
    IGRPStudioBanner,
    IGRPStudioBreadcrumb,
    IGRPStudioEmpty,
    IGRPStudioImageCropper,
    IGRPStudioInputGroup,
    IGRPStudioInputOTP,
    IGRPStudioNavigationMenu,
    IGRPStudioPagination,
    IGRPStudioStepper
} from './renderers/components/StaticElementPreviews'
import IGRPStudioTable from './renderers/components/Table'
import IGRPStudioTableDateFilterPreview from './renderers/components/TableDateFilterPreview'
import IGRPStudioTableRowSubcomponent from './renderers/components/TableRowSubcomponent'
import IGRPStudioTabs from './renderers/components/Tabs'
import IGRPStudioTextList from './renderers/components/TextList'

// Group label map moved to `@renderer/features/component-palette/groups`.
// Re-export the legacy name so any existing import keeps working.
export { GROUP_COMPONET } from '@renderer/features/component-palette'

export const COMPONENT: Record<string, string> = {
    ComponentContent: 'component',
    PageContent: 'page',
    ProcessContent: 'process',
    ProcessStepContent: 'processStep',
    Columns: 'columns',
    Column: 'column',
    Grid: 'grid',
    Flex: 'flex',
    Section: 'section',
    Container: 'container',
    Form: 'form',
    PageHeader: 'pageHeader',

    Link: 'inputUrl',
    Button: 'button',
    Text: 'text',
    Image: 'image',
    RichTextEditor: 'richTextEditor',
    Table: 'table',
    Chart: 'chart',
    Maps: 'maps',
    Carousel: 'carousel',
    Fingerprint: 'fingerprint',
    Input: 'input',
    InputText: 'inputText',
    Date: 'datePicker',
    DatePicker: 'inputDatePicker',
    TimePicker: 'inputTime',
    Password: 'inputPassword',
    Textarea: 'inputTextarea',
    ColorPicker: 'inputColor',
    Select: 'select',
    Combobox: 'combobox',
    AddOn: 'inputAddOn',
    Checkbox: 'checkbox',
    Radio: 'radio',
    Switch: 'switch',
    Number: 'inputNumber',
    Phone: 'inputPhone',
    RangeSlider: 'slider',
    FileUpload: 'inputFile',
    Hidden: 'inputHidden',
    DatePickerRange: 'datePickerRange',

    Dropdown: 'dropdown',
    TableColumn: 'tableColumns',
    TableFilter: 'tableFilters',
    TableRowSubcomponent: 'tableRowSubcomponent',

    TableActionListCell: 'tableActionListCell',
    TableAmountCell: 'tableAmountCell',
    TableCheckboxCell: 'tableCheckboxCell',
    TableDateCell: 'tableDateCell',
    TableableBadgeCell: 'tableBadgeCell',

    TableInputFilter: 'tableInputFilter',
    TableMinMaxFilter: 'tableMinMaxFilter',
    TableFilterDate: 'tableDateFilter',
    TableSelectFilter: 'tableSelectFilter',
    TableFacetedFilter: 'tableFacetedFilter',
    TableFilterDropdown: 'tableDropdownFilter',

    Headline: 'headline',
    Label: 'label',
    Icon: 'icon',

    Box: 'box',
    Panel: 'panel',
    Card: 'card',
    Tabs: 'tabs',

    Badge: 'badge',
    Search: 'inputSearch',

    iFrame: 'iFrame',
    InfoPanel: 'infoPanel',
    Alerts: 'alerts',
    Ratings: 'ratings',

    EmbedVideo: 'videoEmbed',

    CardContent: 'cardContent',
    CardFooter: 'cardFooter',
    CardHeader: 'cardHeader',

    Piechart: 'piechart',
    Chat: 'chat',
    Areachart: 'areachart',
    Linechart: 'linechart',
    Barchart: 'barchart',
    HorizontalBarchart: 'horizontalBarchart',
    VerticalBarchart: 'verticalBarchart',
    RadialBarchart: 'radialBarchart',
    Radarchart: 'radarchart',
    StatsCard: 'statsCard',
    Separator: 'separator',

    ModalDialog: 'modalDialog',
    ModalDialogTitle: 'modalDialogTitle',
    ModalDialogTrigger: 'modalDialogTrigger',
    ModalDialogHeader: 'modalDialogHeader',
    ModalDialogDescription: 'modalDialogDescription',
    ModalDialogContent: 'modalDialogContent',
    ModalDialogFooter: 'modalDialogFooter',

    AlertDialog: 'alertDialog',
    Aspect: 'aspect',
    Fragment: 'fragment',
    Paragraph: 'paragraph',
    RepetitiveList: 'repetitiveList',
    FormList: 'formList',
    MenuNavigation: 'menuNavigation',
    InfoCard: 'infoCard',
    PdfViewer: 'pdfViewer',
    Alert: 'alert',
    TextList: 'textList',
    StatusBanner: 'statusBanner',
    Span: 'span',
    CopyToClipboard: 'copyTo',
    Avatar: 'avatar',
    CalendarSingle: 'calendarSingle',
    CalendarSingleTime: 'calendarSingleTime',
    CalendarRange: 'calendarRange',
    CalendarRangeTime: 'calendarRangeTime',
    CalendarMultiple: 'calendarMultiple',
    CalendarMultipleTime: 'calendarMultipleTime',
    DatePickerSingle: 'datePickerSingle',
    DatePickerMultiple: 'datePickerMultiple',
    InputDatePickerSingle: 'inputDatePickerSingle',
    Accordion: 'accordion',
    CardDetails: 'cardDetails',

    // Group A — engine default components mapped directly to design-system
    // components (leaf, always-render). Keys mirror the engine's registered names.
    Command: 'command',
    DateTimeInput: 'dateTimeInput',
    Progress: 'progress',
    StatsCardMini: 'statsCardMini',
    LoadingSpinner: 'loadingSpinner',
    Notification: 'notification',
    PageHeaderBackButton: 'pageHeaderBackButton',
    StatsCardTopBorderColored: 'statsCardTopBorderColored',
    Toaster: 'toaster',
    UserAvatar: 'userAvatar',
    Spinner: 'spinner',
    ScrollArea: 'scrollArea',
    AspectRatio: 'aspectRatio',
    Skeleton: 'skeleton',
    Kbd: 'kbd',
    FieldDescription: 'fieldDescription',
    Toggle: 'toggle',
    Menubar: 'menubar',
    Popover: 'popover',
    HoverCard: 'hoverCard',
    Sheet: 'sheet',
    Drawer: 'drawer',
    Breadcrumb: 'breadcrumb',
    Pagination: 'pagination',
    InputOTP: 'inputOTP',
    InputGroup: 'inputGroup',
    NavigationMenu: 'navigationMenu',
    Empty: 'empty',
    ImageCropper: 'imageCropper',
    StepperUI: 'stepperUI',
    Banner: 'banner',
    Tooltip: 'tooltip'
} as const

// Icon mapping is the source-of-truth for `componentName → lucide icon`.
// Lifted to `@renderer/features/component-icons` so non-UI-gen surfaces
// (Prototype palette, future generators) can use it without taking a
// dependency on this module. Re-export keeps existing consumers stable.
export { ICON_MAP, resolveIcon } from '@renderer/features/component-icons'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const COMPONENT_MAP: Record<string, any> = {
    [COMPONENT.ColorPicker]: IGRPInputColor,
    [COMPONENT.Date]: IGRPDatePickerSingle,
    [COMPONENT.DatePicker]: IGRPDatePickerSingle,
    [COMPONENT.FileUpload]: IGRPInputFile,
    [COMPONENT.Number]: IGRPInputNumber,
    [COMPONENT.Password]: IGRPInputPassword,
    [COMPONENT.TimePicker]: IGRPInputTime,
    [COMPONENT.Phone]: IGRPInputPhone,
    [COMPONENT.Input]: IGRPInputText,
    [COMPONENT.InputText]: IGRPInputText,
    [COMPONENT.Textarea]: IGRPTextarea,
    [COMPONENT.Link]: IGRPInputUrl,
    [COMPONENT.AddOn]: IGRPInputAddOn,
    [COMPONENT.Select]: IGRPSelect,
    [COMPONENT.Combobox]: IGRPCombobox,
    [COMPONENT.Button]: IGRPButton,
    [COMPONENT.Label]: IGRPLabel,
    [COMPONENT.Checkbox]: IGRPCheckbox,
    [COMPONENT.Radio]: IGRPRadioGroup,
    [COMPONENT.Icon]: IGRPIcon,
    [COMPONENT.Headline]: IGRPHeadline,
    [COMPONENT.Text]: IGRPText,
    [COMPONENT.Switch]: IGRPSwitch,
    [COMPONENT.Search]: IGRPInputSearch,
    [COMPONENT.DatePickerRange]: IGRPDatePickerRange,

    [COMPONENT.Piechart]: IGRPPieChart,
    [COMPONENT.Areachart]: IGRPAreaChart,
    [COMPONENT.Linechart]: IGRPLineChart,
    [COMPONENT.HorizontalBarchart]: IGRPHorizontalBarChart,
    [COMPONENT.VerticalBarchart]: IGRPVerticalBarChart,
    [COMPONENT.Radarchart]: IGRPRadarChart,
    [COMPONENT.RadialBarchart]: IGRPRadialBarChart,

    [COMPONENT.Badge]: IGRPBadge,
    [COMPONENT.PdfViewer]: IGRPPdfViewer,

    [COMPONENT.TableInputFilter]: IGRPDataTableFilterInput,
    [COMPONENT.TableMinMaxFilter]: IGRPDataTableFilterMinMax,
    // Editor-only preview: the DS IGRPDataTableFilterDate currently renders
    // null on the canvas (real picker is TODO upstream) — see the preview file.
    [COMPONENT.TableFilterDate]: IGRPStudioTableDateFilterPreview,
    [COMPONENT.TableSelectFilter]: IGRPDataTableFilterSelect,
    [COMPONENT.TableFacetedFilter]: IGRPDataTableFilterFaceted,
    [COMPONENT.TableFilterDropdown]: IGRPDataTableFilterDropdown,
    [COMPONENT.StatsCard]: IGRPStatsCard,
    [COMPONENT.Separator]: IGRPSeparator,
    [COMPONENT.StatusBanner]: IGRPStatusBanner,

    [COMPONENT.Table]: IGRPStudioTable,
    [COMPONENT.Section]: IGRPStudioSection,
    [COMPONENT.Columns]: IGRPStudioColumns,
    [COMPONENT.Column]: IGRPStudioColumn,
    [COMPONENT.PageContent]: IGRPStudioPage,
    [COMPONENT.PageHeader]: IGRPStudioPageHeader,
    [COMPONENT.Form]: IGRPStudioForm,
    [COMPONENT.Container]: IGRPStudioContainer,
    [COMPONENT.Fragment]: IGRPStudioFragment,
    [COMPONENT.Card]: IGRPStudioCard,
    [COMPONENT.Flex]: IGRPStudioFlex,
    [COMPONENT.Grid]: IGRPStudioGrid,
    [COMPONENT.Tabs]: IGRPStudioTabs,
    [COMPONENT.Paragraph]: IGRPStudioParagraph,
    [COMPONENT.RepetitiveList]: IGRPStudioRepetitive,
    [COMPONENT.FormList]: IGRPStudioFormList,
    [COMPONENT.MenuNavigation]: IGRPStudioMenuNavigation,
    [COMPONENT.InfoCard]: IGRPStudioInfoCard,
    [COMPONENT.Alert]: IGRPStudioAlert,
    [COMPONENT.TextList]: IGRPStudioTextList,
    [COMPONENT.EmbedVideo]: IGRPVideoEmbed,
    [COMPONENT.CopyToClipboard]: IGRPCopyTo,
    [COMPONENT.Avatar]: IGRPAvatar,
    [COMPONENT.CalendarSingle]: IGRPCalendarSingle,
    [COMPONENT.CalendarSingleTime]: IGRPCalendarSingleTime,
    [COMPONENT.CalendarRange]: IGRPCalendarRange,
    [COMPONENT.CalendarRangeTime]: IGRPCalendarRangeTime,
    [COMPONENT.CalendarMultiple]: IGRPCalendarMultiple,
    [COMPONENT.CalendarMultipleTime]: IGRPCalendarMultipleTime,
    [COMPONENT.DatePickerSingle]: IGRPDatePickerSingle,
    [COMPONENT.DatePickerMultiple]: IGRPDatePickerMultiple,
    [COMPONENT.InputDatePickerSingle]: IGRPDatePickerInputSingle,

    [COMPONENT.ModalDialog]: IGRPStudioModalDialog,
    [COMPONENT.ModalDialogTigger]: IGRPStudioDialogTrigger,
    [COMPONENT.ModalDialogTitle]: IGRPSTudioDialogTitle,
    [COMPONENT.ModalDialogHeader]: IGRPSTudioDialogHeader,
    [COMPONENT.ModalDialogDescription]: IGRPStudioDialogDescription,
    [COMPONENT.ModalDialogFooter]: IGRPSTudioDialogFooter,
    [COMPONENT.Accordion]: IGRPStudioAccordion,
    [COMPONENT.CardDetails]: IGRPStudioCardDetails,

    // Group A — engine default components mapped directly to design-system
    // components (leaf, render standalone). `span` maps to IGRPText.
    [COMPONENT.AlertDialog]: IGRPAlertDialog,
    [COMPONENT.Chat]: IGRPChat,
    [COMPONENT.Command]: IGRPCommand,
    [COMPONENT.DateTimeInput]: IGRPDateTimeInput,
    [COMPONENT.Progress]: IGRPStudioProgress,
    [COMPONENT.Image]: IGRPImage,
    [COMPONENT.Hidden]: IGRPInputHidden,
    [COMPONENT.LoadingSpinner]: IGRPLoadingSpinner,
    [COMPONENT.Notification]: IGRPNotification,
    [COMPONENT.PageHeaderBackButton]: IGRPPageHeaderBackButton,
    [COMPONENT.StatsCardMini]: IGRPStatsCardMini,
    [COMPONENT.StatsCardTopBorderColored]: IGRPStatsCardTopBorderColored,
    [COMPONENT.Toaster]: IGRPToaster,
    [COMPONENT.UserAvatar]: IGRPUserAvatar,
    [COMPONENT.Span]: IGRPText,
    // `spinner` is a duplicate of `loadingSpinner` in the engine registry.
    [COMPONENT.Spinner]: IGRPLoadingSpinner,
    // Generic child-wrappers — droppable shells, like container/section/flex.
    [COMPONENT.ScrollArea]: IGRPStudioScrollAreaContainer,
    [COMPONENT.AspectRatio]: IGRPStudioAspectRatioContainer,
    [COMPONENT.Skeleton]: IGRPStudioSkeleton,
    [COMPONENT.Kbd]: IGRPStudioKbd,
    [COMPONENT.FieldDescription]: IGRPStudioFieldDescription,
    [COMPONENT.Toggle]: IGRPStudioToggle,

    // Group B — engine containers with a Studio preview wrapper (children
    // stay droppable/editable on the canvas).
    [COMPONENT.Dropdown]: IGRPStudioDropdown,
    [COMPONENT.Menubar]: IGRPStudioMenubar,

    // Group B — engine leaf components rendered as static canvas previews
    // (real internal structure is generated code, not canvas-editable).
    [COMPONENT.Popover]: IGRPStudioPopover,
    [COMPONENT.HoverCard]: IGRPStudioHoverCard,
    [COMPONENT.Sheet]: IGRPStudioSheet,
    [COMPONENT.Drawer]: IGRPStudioDrawer,
    [COMPONENT.Breadcrumb]: IGRPStudioBreadcrumb,
    [COMPONENT.Pagination]: IGRPStudioPagination,
    [COMPONENT.InputOTP]: IGRPStudioInputOTP,
    [COMPONENT.InputGroup]: IGRPStudioInputGroup,
    [COMPONENT.NavigationMenu]: IGRPStudioNavigationMenu,
    [COMPONENT.Empty]: IGRPStudioEmpty,
    [COMPONENT.ImageCropper]: IGRPStudioImageCropper,
    [COMPONENT.StepperUI]: IGRPStudioStepper,
    [COMPONENT.Banner]: IGRPStudioBanner,
    [COMPONENT.Tooltip]: IGRPStudioTooltip,
    [COMPONENT.TableRowSubcomponent]: IGRPStudioTableRowSubcomponent
}
