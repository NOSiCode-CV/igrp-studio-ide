import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@renderer/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { browserCardClassName } from '@renderer/generators/ui/browser/browser-card-styles'
import { AlertTriangle, Copy, EllipsisVertical, PenSquare, RotateCw, Wrench } from 'lucide-react'
import type { JSX } from 'react/jsx-runtime'
import type { BPMNProjectArtifact, BPMNProjectProcessDefinition, FileTree } from 'src/main/types'
import type { PageDefinition } from '../../page-manager'
import { convertFileTreeToPageDefinition } from '../utils/bpmn-helpers'
import { getFormKeyType, getNormalizedFormKey } from '../utils/form-key-utils'

interface ProcessArtifactCardProps {
    artifact: BPMNProjectArtifact
    selectedProcess: BPMNProjectProcessDefinition
    stepProcessFound: FileTree | undefined
    onPageClick?: (pageDefinition: PageDefinition) => void
    onRegenerateStep: (process: BPMNProjectProcessDefinition, artifact: BPMNProjectArtifact) => void
    onCopyFromLegacyVersion: (
        process: BPMNProjectProcessDefinition,
        artifact: BPMNProjectArtifact
    ) => void
}

export const ProcessArtifactCard = ({
    artifact,
    selectedProcess,
    stepProcessFound,
    onPageClick,
    onRegenerateStep,
    onCopyFromLegacyVersion
}: ProcessArtifactCardProps): JSX.Element => {
    const formKey = getNormalizedFormKey(artifact.formKey)
    const formKeyType = getFormKeyType(artifact.formKey)

    //if formKeyType is unknown, show a warning badge
    if (formKeyType === 'unknown' || formKeyType === 'shared') {
        return (
            <Card className={browserCardClassName('cursor-pointer gap-0 py-0')}>
                <CardHeader className="px-4 py-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-base font-medium text-slate-100">
                                {artifact.name}
                            </CardTitle>
                            <div className="mt-1 text-sm text-slate-400">{artifact.taskKey}</div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                            <Badge variant="outline" className="border-slate-700 text-xs text-slate-300">
                                v{selectedProcess.version || 'N/A'}
                            </Badge>
                            {formKeyType === 'unknown' && (
                                <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-4 w-4" />
                                    Unknown Form Key
                                </Badge>
                            )}
                        </div>
                    </div>
                    {formKeyType === 'shared' && (
                        <CardDescription className="text-slate-400">
                            <div className="flex items-center justify-between space-x-2">
                                <span>Form Key: {formKey}</span>
                                <Badge variant="default" className="text-xs">
                                    {formKeyType}
                                </Badge>
                            </div>
                        </CardDescription>
                    )}
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className={browserCardClassName('cursor-pointer gap-0 py-0')}>
            <CardHeader className="px-4 py-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-base font-medium text-slate-100">
                            {artifact.name}
                        </CardTitle>
                        <div className="mt-1 text-sm text-slate-400">{artifact.taskKey}</div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        <Badge variant="outline" className="border-slate-700 text-xs text-slate-300">
                            v{selectedProcess.version || 'N/A'}
                        </Badge>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-slate-100"
                                >
                                    <EllipsisVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem
                                    disabled={!stepProcessFound}
                                    onClick={() => onRegenerateStep(selectedProcess, artifact)}
                                >
                                    <RotateCw className="mr-2 h-4 w-4" />
                                    Re-generate Step
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        onCopyFromLegacyVersion(selectedProcess, artifact)
                                    }
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy From Legacy Version
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <CardDescription className="text-slate-400">
                    <div className="flex items-center justify-between space-x-2">
                        <span>Form Key: {formKey}</span>
                        <Badge variant="outline" className="border-slate-700 text-xs text-slate-300">
                            {formKeyType}
                        </Badge>
                    </div>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
                {artifact.subProcessTask && (
                    <Badge variant="outline" className="border-slate-700 text-xs text-slate-300">
                        {`Sub Process - ${artifact.subProcessName}`}
                    </Badge>
                )}
                {stepProcessFound ? (
                    <Button
                        size="sm"
                        className="w-full"
                        variant="outline"
                        onClick={() =>
                            onPageClick?.(convertFileTreeToPageDefinition(stepProcessFound))
                        }
                    >
                        <PenSquare className="mr-2 h-4 w-4" />
                        Open Editor
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        className="w-full"
                        variant="default"
                        onClick={() => onRegenerateStep(selectedProcess, artifact)}
                    >
                        <Wrench className="mr-2 h-4 w-4" />
                        Generate Step
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
