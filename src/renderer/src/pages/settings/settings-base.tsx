import type React from "react"
import { IGRPCardPrimitive, IGRPCardHeaderPrimitive, IGRPCardTitlePrimitive, IGRPCardDescriptionPrimitive, IGRPCardContentPrimitive } from '@igrp/igrp-framework-react-design-system';

interface SettingsBaseProps {
  title: string
  description: string
  children: React.ReactNode
}

export function SettingsBase({ title, description, children }: SettingsBaseProps) {
  return (
    <IGRPCardPrimitive className="w-full">
      <IGRPCardHeaderPrimitive>
        <IGRPCardTitlePrimitive>{title}</IGRPCardTitlePrimitive>
        <IGRPCardDescriptionPrimitive>{description}</IGRPCardDescriptionPrimitive>
      </IGRPCardHeaderPrimitive>
      <IGRPCardContentPrimitive>{children}</IGRPCardContentPrimitive>
    </IGRPCardPrimitive>
  )
}

