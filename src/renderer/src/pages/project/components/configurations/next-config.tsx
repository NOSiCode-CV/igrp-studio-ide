'use client';

import { Label } from '@renderer/components/ui/label';
import { Input } from '@renderer/components/ui/input';
import { NextConfigData, ProjectData } from 'src/main/types';
import { Textarea } from '@renderer/components/ui/Textarea';
import { useTranslation } from 'react-i18next';
import { FormikErrors } from 'formik';

interface NextConfigProps {
    data: NextConfigData;
    errors?: FormikErrors<ProjectData>;
    onChange: (data: NextConfigData) => void;
}

const DEFAULT_NEXT_CONFIG: NextConfigData = {
    appName: '',
    description: '',
};

export function NextConfig({
    data = DEFAULT_NEXT_CONFIG,
    errors,
    onChange,
}: NextConfigProps) {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="appName">{t('applicationName')}</Label>
                <Input
                    id="appName"
                    value={data.appName}
                    onChange={(e) =>
                        onChange({ ...data, appName: e.target.value })
                    }
                    placeholder="mynextapp"
                    maxLength={20}
                />
                {errors?.config && errors.config.appName && (
                    <p className="text-xs text-destructive">
                        {errors.config.appName}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) =>
                        onChange({ ...data, description: e.target.value })
                    }
                    placeholder="Project description"
                />
            </div>
        </div>
    );
}
