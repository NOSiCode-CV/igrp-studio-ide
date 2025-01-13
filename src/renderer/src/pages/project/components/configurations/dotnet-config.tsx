import { Label } from '@renderer/components/ui/label';
import { Input } from '@renderer/components/ui/input';
import { Checkbox } from '@renderer/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@renderer/components/ui/select';
import { DotNetConfigData } from 'src/main/types';

interface DotNetConfigProps {
    data: DotNetConfigData;
    onChange: (data: DotNetConfigData) => void;
}

const DEFAULT_DOTNET_CONFIG: DotNetConfigData = {
    projectName: '',
    solutionName: '',
    framework: 'net7.0',
    language: 'C#',
    auth: false,
    https: true,
    dockerSupport: false,
};

export function DotNetConfig({
    data = DEFAULT_DOTNET_CONFIG,
    onChange,
}: DotNetConfigProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                    id="project-name"
                    value={data.projectName}
                    onChange={(e) =>
                        onChange({ ...data, projectName: e.target.value })
                    }
                    placeholder="MyDotNetProject"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="solution-name">Solution Name</Label>
                <Input
                    id="solution-name"
                    value={data.solutionName}
                    onChange={(e) =>
                        onChange({ ...data, solutionName: e.target.value })
                    }
                    placeholder="MyDotNetSolution"
                />
            </div>

            <div className="space-y-2">
                <Label>Framework</Label>
                <Select
                    value={data.framework}
                    onValueChange={(value) =>
                        onChange({ ...data, framework: value })
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="net7.0">.NET 7.0</SelectItem>
                        <SelectItem value="net6.0">.NET 6.0</SelectItem>
                        <SelectItem value="net5.0">.NET 5.0</SelectItem>
                        <SelectItem value="netcoreapp3.1">
                            .NET Core 3.1
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Language</Label>
                <Select
                    value={data.language}
                    onValueChange={(value) =>
                        onChange({ ...data, language: value })
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="C#">C#</SelectItem>
                        <SelectItem value="F#">F#</SelectItem>
                        <SelectItem value="VB">Visual Basic</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="auth"
                        checked={data.auth}
                        onCheckedChange={(checked) =>
                            onChange({ ...data, auth: checked as boolean })
                        }
                    />
                    <Label htmlFor="auth">Include authentication</Label>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="https"
                        checked={data.https}
                        onCheckedChange={(checked) =>
                            onChange({ ...data, https: checked as boolean })
                        }
                    />
                    <Label htmlFor="https">Configure for HTTPS</Label>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="docker"
                        checked={data.dockerSupport}
                        onCheckedChange={(checked) =>
                            onChange({
                                ...data,
                                dockerSupport: checked as boolean,
                            })
                        }
                    />
                    <Label htmlFor="docker">Enable Docker support</Label>
                </div>
            </div>
        </div>
    );
}
