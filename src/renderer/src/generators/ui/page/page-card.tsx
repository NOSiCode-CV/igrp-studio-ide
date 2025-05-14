// page-card.tsx
import { Card, CardContent, CardFooter } from '@renderer/components/ui/card';
import { Button } from '@renderer/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PageCardProps {
    page: {
        name: string;
        path: string;
        status: string;
        created: string;
        pageName: string;
        isPage: boolean;
    };
    onDelete: (page: any) => void;
    onAddComponents: (page: any) => void;
}

export function PageCard({ page, onDelete, onAddComponents }: PageCardProps) {
    const { isPage, pageName } = page;
    const { t } = useTranslation();
    return (
        <Card>
            <CardContent>
                <h3 className="font-semibold mb-2">{pageName}</h3>
                <p className="text-sm text-muted-foreground">
                    {t('Type')}: {isPage ? t("page") : t("component")}
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
