"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@renderer/lib/utils"
import { IGRPTabsListPrimitive, IGRPTabsTriggerPrimitive } from "@igrp/igrp-framework-react-design-system"
import { IGRPTabsContentPrimitive } from "@igrp/igrp-framework-react-design-system"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <IGRPTabsListPrimitive
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center  p-1 text-muted-foreground border-b",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <IGRPTabsTriggerPrimitive
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap  px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <IGRPTabsContentPrimitive
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs as IGRPTabs, TabsList as IGRPTabsList, TabsTrigger as IGRPTabsTrigger, TabsContent as IGRPTabsContent }
