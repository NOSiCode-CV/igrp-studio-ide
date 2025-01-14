'use client';

import { Label } from '@renderer/components/ui/label';
import { Input } from '@renderer/components/ui/input';
import { NextConfigData } from 'src/main/types';
import { Textarea } from '@renderer/components/ui/Textarea';

interface NextConfigProps {
    data: NextConfigData;
    onChange: (data: NextConfigData) => void;
}

const DEFAULT_NEXT_CONFIG: NextConfigData = {
    appName: '',
    description: '',
};

export function NextConfig({
    data = DEFAULT_NEXT_CONFIG,
    onChange,
}: NextConfigProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="app-name">Application Name</Label>
                <Input
                    id="app-name"
                    value={data.appName}
                    onChange={(e) =>
                        onChange({ ...data, appName: e.target.value })
                    }
                    placeholder="my-next-app"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
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
