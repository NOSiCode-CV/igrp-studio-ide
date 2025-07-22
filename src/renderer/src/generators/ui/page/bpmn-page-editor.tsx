import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Textarea } from '@renderer/components/ui/textarea';
import { Badge } from '@renderer/components/ui/badge';
import { Switch } from '@renderer/components/ui/switch';
import { Separator } from '@renderer/components/ui/separator';
import { Workflow, Settings, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { BPMNPageDefinition, BPMNConfig } from 'src/main/types';
import { bpmnService } from '@renderer/services/bpmn-service';
import { useBPMNPages } from '@renderer/hooks/use-bpmn-pages';

interface BPMNPageEditorProps {
    pageDefinition: BPMNPageDefinition;
    onBack: () => void;
    onSave: (pageDefinition: BPMNPageDefinition) => void;
}

export const BPMNPageEditor = ({ pageDefinition, onBack, onSave }: BPMNPageEditorProps) => {
    const { t } = useTranslation();
    const { savePageDefinition } = useBPMNPages();
    const [formData, setFormData] = useState<BPMNPageDefinition>(pageDefinition);
    const [config, setConfig] = useState<BPMNConfig | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const currentConfig = await bpmnService.getConfig();
            setConfig(currentConfig);
        } catch (error) {
            toast.error('Failed to load API configuration');
        }
    };

    const handleInputChange = (field: keyof BPMNPageDefinition, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.pageName || !formData.pagePath) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSaving(true);
        try {
            const updatedPage = {
                ...formData,
                updatedAt: new Date().toISOString(),
            };
            
            await savePageDefinition(updatedPage);
            onSave(updatedPage);
        } catch (error) {
            toast.error('Failed to save page');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to BPMN Manager
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Edit BPMN Process Page</h1>
                    <p className="text-muted-foreground">
                        Configure the page for BPMN process: {pageDefinition.processDefinitionKey}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Workflow className="h-5 w-5" />
                                Page Configuration
                            </CardTitle>
                            <CardDescription>
                                Configure the page settings for this BPMN process
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="pageName">Page Name *</Label>
                                <Input
                                    id="pageName"
                                    value={formData.pageName}
                                    onChange={(e) => handleInputChange('pageName', e.target.value)}
                                    placeholder="Enter page name"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="pagePath">Page Path *</Label>
                                <Input
                                    id="pagePath"
                                    value={formData.pagePath}
                                    onChange={(e) => handleInputChange('pagePath', e.target.value)}
                                    placeholder="/bpmn/process-name"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description || ''}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Enter page description"
                                    rows={3}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="taskDefinitionKey">Task Definition Key</Label>
                                <Input
                                    id="taskDefinitionKey"
                                    value={formData.taskDefinitionKey || ''}
                                    onChange={(e) => handleInputChange('taskDefinitionKey', e.target.value)}
                                    placeholder="task_definition_key"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="formKey">Form Key</Label>
                                <Input
                                    id="formKey"
                                    value={formData.formKey || ''}
                                    onChange={(e) => handleInputChange('formKey', e.target.value)}
                                    placeholder="form_key"
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isStartPage"
                                    checked={formData.isStartPage}
                                    onCheckedChange={(checked) => handleInputChange('isStartPage', checked)}
                                />
                                <Label htmlFor="isStartPage">Start Page</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isTaskPage"
                                    checked={formData.isTaskPage}
                                    onCheckedChange={(checked) => handleInputChange('isTaskPage', checked)}
                                />
                                <Label htmlFor="isTaskPage">Task Page</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Page Content</CardTitle>
                            <CardDescription>
                                Configure the content and behavior of this BPMN page
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Content Type</Label>
                                    <Badge variant="secondary">
                                        {formData.content?.type || 'bpmn-process'}
                                    </Badge>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Process Key</Label>
                                    <code className="text-sm bg-muted px-2 py-1 rounded">
                                        {formData.processDefinitionKey}
                                    </code>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Process Name</Label>
                                    <span className="text-sm">
                                        {formData.content?.processName || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Process Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Process Key</Label>
                                <code className="text-xs bg-muted px-2 py-1 rounded block">
                                    {pageDefinition.processDefinitionKey}
                                </code>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Process ID</Label>
                                <span className="text-sm text-muted-foreground">
                                    {pageDefinition.processDefinitionId}
                                </span>
                            </div>

                            {config && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">API Configuration</Label>
                                        <div className="space-y-1">
                                            <span className="text-sm font-medium">{config.name}</span>
                                            <div className="text-xs text-muted-foreground">
                                                {config.apiUrl}
                                            </div>
                                            <Badge variant={config.status === 'connected' ? 'default' : 'secondary'} className="text-xs">
                                                {config.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </>
                            )}

                            <Separator />

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Created</Label>
                                <span className="text-sm text-muted-foreground">
                                    {new Date(pageDefinition.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Last Updated</Label>
                                <span className="text-sm text-muted-foreground">
                                    {new Date(pageDefinition.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button 
                                className="w-full" 
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Page'}
                            </Button>

                            <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => {
                                    // TODO: Open in page builder
                                    toast.info('Opening in page builder...');
                                }}
                            >
                                Open in Page Builder
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}; 