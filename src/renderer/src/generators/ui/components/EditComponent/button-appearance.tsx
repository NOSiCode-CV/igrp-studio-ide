'use client';

import { useEffect, useState } from 'react';
import { Button } from '@renderer/components/ui/button';
import { Label } from '@renderer/components/ui/label';
import {
    RadioGroup,
    RadioGroupItem,
} from '@renderer/components/ui/radio-group';
import { Switch } from '@renderer/components/ui/switch';

interface ButtonAppearance {
    variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link';
    size: 'default' | 'sm' | 'lg' | 'icon';
    isDisabled: boolean;
    isLoading: boolean;
    customClasses: string;
}

export function ButtonAppearancePanel({
    onChange,
}: {
    onChange: (changes: any) => void;
}) {
    const [appearance, setAppearance] = useState<ButtonAppearance>({
        variant: 'default',
        size: 'default',
        isDisabled: false,
        isLoading: false,
        customClasses: '',
    });

    const updateAppearance = (key: keyof ButtonAppearance, value: any) => {
        setAppearance((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        onChange(appearance);
    }, [appearance]);

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Variant</Label>
                <RadioGroup
                    value={appearance.variant}
                    onValueChange={(value) =>
                        updateAppearance('variant', value)
                    }
                    className="grid grid-cols-3 gap-2"
                >
                    {[
                        'default',
                        'destructive',
                        'outline',
                        'secondary',
                        'ghost',
                        'link',
                    ].map((variant) => (
                        <div key={variant}>
                            <RadioGroupItem
                                value={variant}
                                id={`variant-${variant}`}
                                className="peer sr-only"
                            />
                            <Label
                                htmlFor={`variant-${variant}`}
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                                <Button
                                    variant={variant as any}
                                    size="sm"
                                    className="pointer-events-none"
                                >
                                    {variant}
                                </Button>
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            <div className="space-y-2">
                <Label>Size</Label>
                <RadioGroup
                    value={appearance.size}
                    onValueChange={(value) => updateAppearance('size', value)}
                    className="grid grid-cols-4 gap-2"
                >
                    {['default', 'sm', 'lg', 'icon'].map((size) => (
                        <div key={size}>
                            <RadioGroupItem
                                value={size}
                                id={`size-${size}`}
                                className="peer sr-only"
                            />
                            <Label
                                htmlFor={`size-${size}`}
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                                <Button
                                    variant="outline"
                                    size={size as any}
                                    className="pointer-events-none"
                                >
                                    {size}
                                </Button>
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            <div className="space-y-2">
                <Label>States</Label>
                <div className="flex items-center justify-between">
                    <span className="text-sm">Disabled</span>
                    <Switch
                        checked={appearance.isDisabled}
                        onCheckedChange={(checked) =>
                            updateAppearance('isDisabled', checked)
                        }
                    />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm">Loading</span>
                    <Switch
                        checked={appearance.isLoading}
                        onCheckedChange={(checked) =>
                            updateAppearance('isLoading', checked)
                        }
                    />
                </div>
            </div>
        </div>
    );
}
