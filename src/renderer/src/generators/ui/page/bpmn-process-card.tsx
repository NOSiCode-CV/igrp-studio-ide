import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { Button } from '@renderer/components/ui/button';
import { Badge } from '@renderer/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { 
    Download, 
    Eye, 
    Edit, 
    MoreHorizontal,
    Workflow
} from 'lucide-react';
import { BPMNProcessDefinition } from 'src/main/types';

interface BPMNProcessCardProps {
    process: BPMNProcessDefinition;
    onEdit: (process: BPMNProcessDefinition) => void;
    onView: (process: BPMNProcessDefinition) => void;
    onDownloadXML: (process: BPMNProcessDefinition) => void;
}

export const BPMNProcessCard = ({
    process,
    onEdit,
    onView,
    onDownloadXML,
}: BPMNProcessCardProps) => {
    const getStatusColor = (suspended: boolean) => {
        return suspended ? 'destructive' : 'default';
    };

    const getStatusText = (suspended: boolean) => {
        return suspended ? 'Suspended' : 'Active';
    };

    return (
        <Card className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Workflow className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">
                                {process.name}
                            </CardTitle>
                            <CardDescription className="text-sm truncate max-w-[200px]">
                                {process.description || 'No description'}
                            </CardDescription>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(process)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDownloadXML(process)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download XML
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-3">
                    {/* Process Information */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Key:</span>
                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                {process.key}
                            </code>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Version:</span>
                            <Badge variant="outline" className="text-xs">
                                v{process.version}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Category:</span>
                            <Badge variant="secondary" className="text-xs">
                                {process.category}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant={getStatusColor(process.suspended)} className="text-xs">
                                {getStatusText(process.suspended)}
                            </Badge>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                        <Button
                            size="sm"
                            className="w-full"
                            onClick={() => onEdit(process)}
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Page
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}; 