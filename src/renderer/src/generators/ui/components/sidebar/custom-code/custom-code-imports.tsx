import { Import } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { nanoid } from '@reduxjs/toolkit';
import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ImportComponentProps {
    onChange?: (imports: Import[]) => void;
    initialImports?: Import[];
}

const ImportComponent = ({
    onChange,
    initialImports = [],
}: ImportComponentProps) => {
    const { t } = useTranslation();
    const [imports, setImports] = useState<Import[]>(initialImports);
    const [newImport, setNewImport] = useState<string>('');

    const parseImport = (input: string): Import | null => {
        //const match = input.match(/import\s+\{?\s*([^}]*)\s*\}?\s+from\s+['"]([^'"]+)['"]/);
        //if (!match) return null;

        return {
            id: `import_${nanoid(6).replace(/-/g, '')}`,
            namespace: input.trim(),
        };
    };

    const addImport = () => {
        const parsed = parseImport(newImport);
        if (
            parsed &&
            !imports.some((imp) => imp.namespace === parsed.namespace)
        ) {
            setImports([...imports, parsed]);
            setNewImport('');
            onChange?.(imports);
        }
    };

    const removeImport = (id: string) => {
        setImports(imports.filter((imp) => imp.id !== id));
        onChange?.(imports.filter((imp) => imp.id !== id));
    };

    useEffect(() => {
        setImports(initialImports);
    }, [initialImports]);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>{t('imports.title')}</Label>
                <Badge variant="outline" className="text-xs">
                    {imports.length}{' '}
                    {t('imports.count', { count: imports.length })}
                </Badge>
            </div>

            <div className="border rounded-md p-3 space-y-2">
                {imports.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {imports.map((imp) => (
                            <Badge
                                key={imp.id}
                                variant="secondary"
                                className="px-2 py-1 flex items-center gap-1"
                            >
                                <span className="font-mono">
                                    {imp.namespace}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 ml-1"
                                    onClick={() => removeImport(imp.id)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">
                        {t('imports.empty')}
                    </p>
                )}

                <div className="flex gap-2">
                    <Input
                        value={newImport}
                        onChange={(e) => setNewImport(e.target.value)}
                        placeholder={t('imports.placeholder')}
                        className="h-8 flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && addImport()}
                    />
                    <Button
                        type="button"
                        size="sm"
                        className="h-8"
                        onClick={addImport}
                        disabled={!newImport}
                    >
                        <Plus /> {t('add')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export { ImportComponent };

/* {
  "imports": {
    "title": "Imports",
    "count": "{count} import | {count} imports",
    "empty": "No imports configured",
    "placeholder": "e.g., import { lib } from 'react-library'"
  },
  "add": "Add"
} */
