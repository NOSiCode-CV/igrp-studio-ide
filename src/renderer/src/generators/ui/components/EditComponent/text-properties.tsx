'use client';

import { useState } from 'react';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@renderer/components/ui/select';
import { Toggle } from '@renderer/components/ui/toggle';
import { Label } from '@renderer/components/ui/label';
import { Plus, Italic, Underline, Strikethrough } from 'lucide-react';

interface TextProperties {
    fontWeight: string;
    fontSize: number;
    textColor: string;
    lineHeight: string;
    letterSpacing: string;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    maxLines: string;
    styling: {
        italic: boolean;
        underline: boolean;
        strikethrough: boolean;
    };
    prompt: {
        type: 'default' | 'custom' | 'none';
        customValue: string;
    };
}

export function TextPropertiesPanel() {
    const [properties, setProperties] = useState<TextProperties>({
        fontWeight: '400',
        fontSize: 14,
        textColor: 'primary',
        lineHeight: '',
        letterSpacing: '',
        textAlign: 'left',
        maxLines: '',
        styling: {
            italic: false,
            underline: false,
            strikethrough: false,
        },
        prompt: {
            type: 'default',
            customValue: '',
        },
    });

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Font Weight</Label>
                        <Select
                            value={properties.fontWeight}
                            onValueChange={(value) =>
                                setProperties((prev) => ({
                                    ...prev,
                                    fontWeight: value,
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="400">
                                    400 - Normal
                                </SelectItem>
                                <SelectItem value="500">
                                    500 - Medium
                                </SelectItem>
                                <SelectItem value="600">
                                    600 - Semibold
                                </SelectItem>
                                <SelectItem value="700">700 - Bold</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Styling</Label>
                        <div className="flex gap-1">
                            <Toggle
                                pressed={properties.styling.italic}
                                onPressedChange={(pressed) =>
                                    setProperties((prev) => ({
                                        ...prev,
                                        styling: {
                                            ...prev.styling,
                                            italic: pressed,
                                        },
                                    }))
                                }
                                size="sm"
                            >
                                <Italic className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                                pressed={properties.styling.underline}
                                onPressedChange={(pressed) =>
                                    setProperties((prev) => ({
                                        ...prev,
                                        styling: {
                                            ...prev.styling,
                                            underline: pressed,
                                        },
                                    }))
                                }
                                size="sm"
                            >
                                <Underline className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                                pressed={properties.styling.strikethrough}
                                onPressedChange={(pressed) =>
                                    setProperties((prev) => ({
                                        ...prev,
                                        styling: {
                                            ...prev.styling,
                                            strikethrough: pressed,
                                        },
                                    }))
                                }
                                size="sm"
                            >
                                <Strikethrough className="h-4 w-4" />
                            </Toggle>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Font Size</Label>
                        <Input
                            type="number"
                            value={properties.fontSize}
                            onChange={(e) =>
                                setProperties((prev) => ({
                                    ...prev,
                                    fontSize:
                                        Number.parseInt(e.target.value) || 14,
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Text Color</Label>
                        <Select
                            value={properties.textColor}
                            onValueChange={(value) =>
                                setProperties((prev) => ({
                                    ...prev,
                                    textColor: value,
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="primary">
                                    Primary Text
                                </SelectItem>
                                <SelectItem value="secondary">
                                    Secondary Text
                                </SelectItem>
                                <SelectItem value="muted">
                                    Muted Text
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Line Height</Label>
                        <Input
                            value={properties.lineHeight}
                            onChange={(e) =>
                                setProperties((prev) => ({
                                    ...prev,
                                    lineHeight: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Letter Spacing</Label>
                        <Input
                            value={properties.letterSpacing}
                            onChange={(e) =>
                                setProperties((prev) => ({
                                    ...prev,
                                    letterSpacing: e.target.value,
                                }))
                            }
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Text Align</Label>
                    <div className="flex gap-1">
                        {['left', 'center', 'right', 'justify'].map((align) => (
                            <Toggle
                                key={align}
                                pressed={properties.textAlign === align}
                                onPressedChange={() =>
                                    setProperties((prev) => ({
                                        ...prev,
                                        textAlign:
                                            align as TextProperties['textAlign'],
                                    }))
                                }
                                size="sm"
                                className="flex-1"
                            >
                                <div className="w-full flex justify-center">
                                    <div
                                        className={`w-4 h-4 flex items-center justify-${align}`}
                                    >
                                        <div className="w-full border-t border-current" />
                                    </div>
                                </div>
                            </Toggle>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Max Lines</Label>
                    <Input
                        type="number"
                        value={properties.maxLines}
                        onChange={(e) =>
                            setProperties((prev) => ({
                                ...prev,
                                maxLines: e.target.value,
                            }))
                        }
                    />
                </div>

                <div className="pt-2">
                    <Button variant="secondary" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Shadow
                    </Button>
                </div>
            </div>
        </div>
    );
}
