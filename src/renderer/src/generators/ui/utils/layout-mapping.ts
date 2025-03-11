import { cva } from "class-variance-authority";

// Comprehensive layout mapping with exhaustive options for flex and grid
export const layoutMapping = {
    // Flex layout options
    flex: {
        // Basic flex directions
        row: "flex flex-row",
        "row-reverse": "flex flex-row-reverse",
        col: "flex flex-col",
        "col-reverse": "flex flex-col-reverse",

        // Justify content options
        "justify-start": "flex justify-start",
        "justify-end": "flex justify-end",
        "justify-center": "flex justify-center",
        "justify-between": "flex justify-between",
        "justify-around": "flex justify-around",
        "justify-evenly": "flex justify-evenly",

        // Align items options
        "items-start": "flex items-start",
        "items-end": "flex items-end",
        "items-center": "flex items-center",
        "items-baseline": "flex items-baseline",
        "items-stretch": "flex items-stretch",

        // Flex wrap options
        "wrap": "flex flex-wrap",
        "wrap-reverse": "flex flex-wrap-reverse",
        "nowrap": "flex flex-nowrap",

        // Common combinations
        "center": "flex items-center justify-center",
        between: "flex items-center justify-between",
        "center-col": "flex flex-col items-center justify-center",
        "start-col": "flex flex-col items-start",
        "end-col": "flex flex-col items-end",

        // Gap options
        "gap-sm": "flex gap-2",
        "gap-md": "flex gap-4",
        "gap-lg": "flex gap-6",

        // Responsive options
        "responsive-stack": "flex flex-col md:flex-row",
        "responsive-unstack": "flex flex-row md:flex-col",

        // Content alignment
        "content-start": "flex content-start",
        "content-end": "flex content-end",
        "content-center": "flex content-center",
        "content-between": "flex content-between",
        "content-around": "flex content-around",
        "content-evenly": "flex content-evenly",

        custom: "" // Custom will use the className directly
    },

    // Grid layout options
    grid: {
        // Basic grid columns
        cols1: "grid grid-cols-1 gap-4",
        cols2: "grid grid-cols-2 gap-4",
        cols3: "grid grid-cols-3 gap-4",
        cols4: "grid grid-cols-4 gap-4",
        cols5: "grid grid-cols-5 gap-4",
        cols6: "grid grid-cols-6 gap-4",
        cols12: "grid grid-cols-12 gap-4",

        // Basic grid rows
        rows1: "grid grid-rows-1 gap-4",
        rows2: "grid grid-rows-2 gap-4",
        rows3: "grid grid-rows-3 gap-4",
        rows4: "grid grid-rows-4 gap-4",
        rows5: "grid grid-rows-5 gap-4",
        rows6: "grid grid-rows-6 gap-4",

        // Auto grid options
        "auto-cols": "grid auto-cols-auto gap-4",
        "auto-rows": "grid auto-rows-auto gap-4",
        "auto-flow-row": "grid grid-flow-row gap-4",
        "auto-flow-col": "grid grid-flow-col gap-4",
        "auto-flow-dense": "grid grid-flow-dense gap-4",

        // Responsive grid options
        "responsive-cols": "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
        "responsive-cols-small": "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
        "responsive-cols-large": "grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4",

        // Grid placement options
        "place-items-center": "grid place-items-center gap-4",
        "place-items-start": "grid place-items-start gap-4",
        "place-items-end": "grid place-items-end gap-4",
        "place-items-stretch": "grid place-items-stretch gap-4",

        "place-content-center": "grid place-content-center gap-4",
        "place-content-start": "grid place-content-start gap-4",
        "place-content-end": "grid place-content-end gap-4",
        "place-content-between": "grid place-content-between gap-4",
        "place-content-around": "grid place-content-around gap-4",
        "place-content-evenly": "grid place-content-evenly gap-4",
        "place-content-stretch": "grid place-content-stretch gap-4",

        // Common layouts
        "holy-grail": "grid grid-cols-[200px_1fr_200px] grid-rows-[auto_1fr_auto] min-h-screen gap-4",
        "sidebar-left": "grid grid-cols-[250px_1fr] gap-4",
        "sidebar-right": "grid grid-cols-[1fr_250px] gap-4",
        "header-content-footer": "grid grid-rows-[auto_1fr_auto] min-h-screen gap-4",

        // Gap options
        "gap-sm": "grid gap-2",
        "gap-md": "grid gap-4",
        "gap-lg": "grid gap-6",

        custom: "" // Custom will use the className directly
    },

    // Container layout options
    container: {
        default: "container mx-auto px-4",
        narrow: "container mx-auto px-4 max-w-4xl",
        wide: "container mx-auto px-4 max-w-7xl",
        full: "container mx-auto px-4 max-w-full",
        responsive: "container mx-auto px-4 sm:px-6 lg:px-8",
        custom: ""
    },

    // Card layout options
    card: {
        default: "bg-white rounded-lg shadow-md p-6",
        bordered: "bg-white rounded-lg border border-gray-200 p-6",
        elevated: "bg-white rounded-lg shadow-lg p-6",
        flat: "bg-white rounded-lg p-6",
        interactive: "bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300",
        custom: ""
    },

    // Section layout options
    section: {
        default: "py-12",
        compact: "py-6",
        spacious: "py-24",
        divider: "py-12 border-b border-gray-200",
        custom: ""
    },

    // Stack layout (vertical spacing between children)
    stack: {
        xs: "space-y-1",
        sm: "space-y-2",
        md: "space-y-4",
        lg: "space-y-6",
        xl: "space-y-8",
        "2xl": "space-y-12",
        custom: ""
    },

    // Inline layout (horizontal spacing between children)
    inline: {
        xs: "space-x-1",
        sm: "space-x-2",
        md: "space-x-4",
        lg: "space-x-6",
        xl: "space-x-8",
        "2xl": "space-x-12",
        custom: ""
    },

    // Aspect ratio container
    aspect: {
        "square": "aspect-square",
        "video": "aspect-video",
        "portrait": "aspect-[2/3]",
        "landscape": "aspect-[3/2]",
        "ultrawide": "aspect-[21/9]",
        "golden": "aspect-[1.618/1]",
        custom: ""
    }
};

export const columnsVariants = cva(
    "flex flex-1",
    {
        variants: {
            variant: {
                cols1: "grid grid-cols-1 gap-4",
                cols2: "grid grid-cols-2 gap-4",
                cols3: "grid grid-cols-3 gap-4",
                cols4: "grid grid-cols-4 gap-4",
                cols5: "grid grid-cols-5 gap-4",
                cols6: "grid grid-cols-6 gap-4",
                cols7: "grid grid-cols-7 gap-4",
                cols8: "grid grid-cols-8 gap-4",
                cols9: "grid grid-cols-9 gap-4",
                cols10: "grid grid-cols-10 gap-4",
                cols11: "grid grid-cols-11 gap-4",
                cols12: "grid grid-cols-12 gap-4",
            },
        },
        defaultVariants: {
            variant: "cols12",
        },
    }
)

export const columnVariants = cva(
    "flex flex-col",
    {
        variants: {
            variant: {
                span1: "col-span-1",
                span2: "col-span-2",
                span3: "col-span-3",
                span4: "col-span-4",
                span5: "col-span-5",
                span6: "col-span-6",
                span7: "col-span-7",
                span8: "col-span-8",
                span9: "col-span-9",
                span10: "col-span-10",
                span11: "col-span-11",
                span12: "col-span-12",
            },
        },
        defaultVariants: {
            variant: "span6",
        },
    }
)

export const gridVariants = cva(
    "",
    {
        variants: {
            variant: layoutMapping['grid']
        },
        defaultVariants: {
            variant: "cols4",
        },
    }
)

export const formVariants = cva(
    "flex flex-col",
    {
        variants: {
            variant: layoutMapping['grid']
        },
        defaultVariants: {
            variant: "cols4",
        },
    }
)