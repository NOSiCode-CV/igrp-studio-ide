// page-card.tsx
import { Card, CardContent, CardFooter } from '@renderer/components/ui/card';
import { Button } from '@renderer/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PageCardProps {
    page: {
        name: string;
        description: string;
        path: string;
        pagePath: string;
        status: string;
        created: string;
        pageName: string;
        isPage: boolean;
    };
    onDelete: (page: any) => void;
    onAddComponents: (page: any) => void;
}

export function PageCard({ page, onDelete, onAddComponents }: PageCardProps) {
    const { isPage, description, pageName, pagePath } = page;
    const { t } = useTranslation();
    return (
        <Card>
            <CardContent>
                <h3 className="font-semibold mb-2">
                    {description || pageName}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {t('path')}: {pagePath}
                </p>
                <p className="text-sm text-muted-foreground">
                    {t('type')}: {isPage ? 'Page' : 'Component'}
                </p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddComponents(page)}
                >
                    <Edit className="h-4 w-4 mr-2" />
                    {isPage ? t('addComponents') : t('editComponents')}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(page)}
                >
                    <Trash className="h-4 w-4 text-red-500" />
                    <span>{t('delete')}</span>
                </Button>
            </CardFooter>
        </Card>
    );
}
