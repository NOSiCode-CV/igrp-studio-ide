import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@renderer/components/ui/card'
import type React from 'react'

interface SettingsBaseProps {
    title: string
    description: string
    children: React.ReactNode
}

export function SettingsBase({ title, description, children }: SettingsBaseProps) {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    )
}
