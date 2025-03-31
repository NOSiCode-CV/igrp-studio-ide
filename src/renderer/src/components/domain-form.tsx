'use client';

import { useEffect, useState } from 'react';
import { Button } from '@renderer/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@renderer/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@renderer/components/ui/input';
import { IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system';

interface KeyValuePair {
    id: string;
    label: string;
    value: string;
}

export default function DomainForm({
    onAdd,
}: {
    onAdd: (domains: IGRPOptionsProps[]) => void;
}) {
    const [pairs, setPairs] = useState<KeyValuePair[]>([
        { id: '1', value: '', label: '' },
    ]);

    const addPair = () => {
        const newPair: KeyValuePair = {
            id: Date.now().toString(),
            label: '',
            value: '',
        };

        setPairs([...pairs, newPair]);
    };

    const removePair = (id: string) => {
        setPairs(pairs.filter((pair) => pair.id !== id));
    };

    const updatePair = (
        id: string,
        field: 'label' | 'value',
        value: string
    ) => {
        setPairs(
            pairs.map((pair) =>
                pair.id === id ? { ...pair, [field]: value } : pair
            )
        );
    };

    useEffect(() => {
        const options: IGRPOptionsProps[] = pairs
            .filter((pair) => pair.value && pair.label)
            .map(({ id, ...rest }) => rest);
        onAdd(options);
    }, [pairs]);

    return (
        <div className="w-full max-w-3xl mx-auto border bg-card rounded-lg space-y-6 px-2">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Value</TableHead>
                        <TableHead>Label</TableHead>
                        <TableHead>
                            <Button
                                onClick={addPair}
                                size="sm"
                                variant={'ghost'}
                                className="text-igrp"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="sr-only">Add Row</span>
                            </Button>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pairs.map((pair) => (
                        <TableRow key={pair.id}>
                            <TableCell>
                                <Input
                                    value={pair.value}
                                    onChange={(e) =>
                                        updatePair(
                                            pair.id,
                                            'value',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter value"
                                    className="border-0 focus-visible:ring-0 p-0 h-8"
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    value={pair.label}
                                    onChange={(e) =>
                                        updatePair(
                                            pair.id,
                                            'label',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter Label"
                                    className="border-0 focus-visible:ring-0 p-0 h-8"
                                />
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removePair(pair.id)}
                                    aria-label="Remove row"
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
