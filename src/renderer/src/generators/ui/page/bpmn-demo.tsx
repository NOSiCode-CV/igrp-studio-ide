import { useState, useEffect } from 'react';
import { Button } from '@renderer/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';
import { Progress } from '@renderer/components/ui/progress';
import { Separator } from '@renderer/components/ui/separator';
import { 
    Play, 
    Download, 
    Eye, 
    Edit, 
    Clock, 
    User, 
    CheckCircle, 
    AlertCircle,
    TrendingUp,
    Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { BPMNProcessDefinition, BPMNProcessInstance, BPMNTask } from 'src/main/types';
import { bpmnMockService } from '@renderer/services/bpmn-mock-service';

export const BPMNDemo = () => {
    const [processDefinitions, setProcessDefinitions] = useState<BPMNProcessDefinition[]>([]);
    const [processInstances, setProcessInstances] = useState<BPMNProcessInstance[]>([]);
    const [tasks, setTasks] = useState<BPMNTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProcess, setSelectedProcess] = useState<BPMNProcessDefinition | null>(null);

    useEffect(() => {
        loadMockData();
    }, []);

    const loadMockData = async () => {
        setLoading(true);
        try {
            const [processes, instances, taskList] = await Promise.all([
                bpmnMockService.getProcessDefinitions(),
                bpmnMockService.getProcessInstances(),
                bpmnMockService.getTasks()
            ]);
            
            setProcessDefinitions(processes);
            setProcessInstances(instances);
            setTasks(taskList);
        } catch (error) {
            toast.error('Failed to load mock data');
        } finally {
            setLoading(false);
        }
    };



    const handleCompleteTask = async (task: BPMNTask) => {
        try {
            await bpmnMockService.completeTask(task.id);
            toast.success(`Completed task: ${task.name}`);
            await loadMockData(); // Reload to update task list
        } catch (error) {
            toast.error('Failed to complete task');
        }
    };

    const getStatusColor = (suspended: boolean) => {
        return suspended ? 'destructive' : 'default';
    };

    const getStatusText = (suspended: boolean) => {
        return suspended ? 'Suspended' : 'Active';
    };

    const getProcessStats = () => {
        const totalProcesses = processDefinitions.length;
        const activeProcesses = processDefinitions.filter(p => !p.suspended).length;
        const totalInstances = processInstances.length;
        const activeInstances = processInstances.filter(i => i.state === 'active').length;
        const pendingTasks = tasks.length;

        return {
            totalProcesses,
            activeProcesses,
            totalInstances,
            activeInstances,
            pendingTasks
        };
    };

    const stats = getProcessStats();

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            <div>
                                <p className="text-sm font-medium">Process Definitions</p>
                                <p className="text-2xl font-bold">{stats.totalProcesses}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <div>
                                <p className="text-sm font-medium">Active Processes</p>
                                <p className="text-2xl font-bold">{stats.activeProcesses}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Play className="h-4 w-4 text-purple-500" />
                            <div>
                                <p className="text-sm font-medium">Process Instances</p>
                                <p className="text-2xl font-bold">{stats.totalInstances}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <div>
                                <p className="text-sm font-medium">Active Instances</p>
                                <p className="text-2xl font-bold">{stats.activeInstances}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-red-500" />
                            <div>
                                <p className="text-sm font-medium">Pending Tasks</p>
                                <p className="text-2xl font-bold">{stats.pendingTasks}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Process Definitions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Process Definitions
                        </CardTitle>
                        <CardDescription>
                            Available BPMN process definitions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {processDefinitions.map((process) => (
                            <div key={process.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium">{process.name}</h4>
                                        <p className="text-sm text-muted-foreground">{process.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline" className="text-xs">
                                                v{process.version}
                                            </Badge>
                                            <Badge variant={getStatusColor(process.suspended)} className="text-xs">
                                                {getStatusText(process.suspended)}
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                                {process.category}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        
                                                                            <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedProcess(process)}
                                    >
                                        <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            toast.info(`Opening ${process.name} in page builder...`);
                                            // This would normally call onPageClick with the page definition
                                        }}
                                    >
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Active Tasks */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Pending Tasks
                        </CardTitle>
                        <CardDescription>
                            User tasks waiting for completion
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {tasks.length > 0 ? (
                            tasks.map((task) => (
                                <div key={task.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium">{task.name}</h4>
                                            <p className="text-sm text-muted-foreground">{task.description}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {task.assignee}
                                                </Badge>
                                                <Badge variant="secondary" className="text-xs">
                                                    Priority: {task.priority}
                                                </Badge>
                                                {task.due && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        Due: {new Date(task.due).toLocaleDateString()}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleCompleteTask(task)}
                                        >
                                            <CheckCircle className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                                <p>No pending tasks</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Process Instances */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5" />
                        Process Instances
                    </CardTitle>
                    <CardDescription>
                        Running and completed process instances
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {processInstances.map((instance) => (
                            <div key={instance.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium">{instance.processDefinitionName}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Business Key: {instance.businessKey}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant={instance.state === 'active' ? 'default' : 'secondary'}>
                                                {instance.state}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                Started: {new Date(instance.startTime).toLocaleDateString()}
                                            </span>
                                            {instance.endTime && (
                                                <span className="text-sm text-muted-foreground">
                                                    Completed: {new Date(instance.endTime).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {instance.state === 'active' && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4 text-orange-500" />
                                                <span className="text-sm">
                                                    {Math.floor(instance.durationInMillis / 3600000)}h
                                                </span>
                                            </div>
                                        )}
                                        {instance.state === 'completed' && (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Selected Process Details */}
            {selectedProcess && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Process Details: {selectedProcess.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <h4 className="font-medium mb-2">Process Information</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Key:</span>
                                        <code className="bg-muted px-2 py-1 rounded">{selectedProcess.key}</code>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Version:</span>
                                        <span>v{selectedProcess.version}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Category:</span>
                                        <span>{selectedProcess.category}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status:</span>
                                        <Badge variant={getStatusColor(selectedProcess.suspended)}>
                                            {getStatusText(selectedProcess.suspended)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Actions</h4>
                                <div className="space-y-2">
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        onClick={() => handleStartProcess(selectedProcess)}
                                        disabled={selectedProcess.suspended}
                                    >
                                        <Play className="h-4 w-4 mr-2" />
                                        Start Process
                                    </Button>
                                    <Button size="sm" variant="outline" className="w-full">
                                        <Download className="h-4 w-4 mr-2" />
                                        Download XML
                                    </Button>
                                    <Button size="sm" variant="outline" className="w-full">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Process
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <Separator className="my-4" />
                        <p className="text-sm text-muted-foreground">{selectedProcess.description}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}; 