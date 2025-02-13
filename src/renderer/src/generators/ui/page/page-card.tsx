import { Card, CardContent, CardFooter } from '@renderer/components/ui/card';
import { Button } from '@renderer/components/ui/button';
import { Component, Trash } from 'lucide-react';

interface PageCardProps {
    page: {
        name: string;
        path: string;
        status: string;
        created: string;
        content: {
            pageName: string;
        };
    };
    onDelete: (page: any) => void;
    onAddComponents: (page: any) => void;
}

export function PageCard({ page, onDelete, onAddComponents }: PageCardProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">{page?.content.pageName}</h3>
                <p className="text-sm text-muted-foreground">
                    Created: {page.created}
                </p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddComponents(page)}
                >
                    <Component className="h-4 w-4 mr-2" />
                    Add Components
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(page)}
                >
                    <Trash className="h-4 w-4 text-red-500" />
                    <span>Delete</span>
                </Button>
            </CardFooter>
        </Card>
    );
}
